#!/usr/bin/env bash
set -euo pipefail
# Separate runtime for the public demo. Never touches the host Docker daemon.
[[ $(id -u) == 0 ]] || { echo 'root required' >&2; exit 1; }
[[ $(hostname) == roomhacker-server-88 ]] || { echo 'Wrong host' >&2; exit 1; }
mem_kb=$(awk '/^MemAvailable:/ {print $2}' /proc/meminfo)
(( mem_kb >= 48*1024*1024 )) || { echo 'Need demo allowance plus 32GiB host reserve' >&2; exit 75; }
disk_kb=$(df -Pk /var/lib | awk 'NR==2 {print $4}')
if ! id airlock-demo >/dev/null 2>&1; then
  (( disk_kb >= 68*1024*1024 )) || { echo 'Need 48GiB demo disk plus 20GiB reserve' >&2; exit 75; }
  useradd --system --no-create-home --home-dir /var/lib/airlock-demo --shell /bin/bash airlock-demo
fi
demo_uid=$(id -u airlock-demo)
if ! command -v newuidmap >/dev/null; then
  export DEBIAN_FRONTEND=noninteractive
  apt-get update
  apt-get install -y uidmap dbus-user-session
fi
if ! grep -q '^airlock-demo:' /etc/subuid; then
  sub_start=$(awk -F: 'BEGIN{m=1000000} {e=$2+$3;if(e>m)m=e} END{print int((m+65535)/65536)*65536}' /etc/subuid /etc/subgid)
  usermod --add-subuids "$sub_start-$((sub_start+65535))" --add-subgids "$sub_start-$((sub_start+65535))" airlock-demo
fi
# The private filesystem is a finite 48GiB sparse image: data/cache cannot fill the host.
if [[ ! -f /var/lib/airlock-demo-root.img ]]; then
  install -d /var/lib/airlock-demo
  # Earlier owned bootstrap may have copied only stock /etc/skel files.
  if [[ -n $(ls -A /var/lib/airlock-demo) ]]; then
    install -d -m 0700 /var/lib/airlock-demo-skels
    for entry in /var/lib/airlock-demo/.[!.]* /var/lib/airlock-demo/*; do
      [[ -e "$entry" ]] || continue
      name=$(basename "$entry")
      [[ -f "$entry" && -f "/etc/skel/$name" ]] && cmp -s "$entry" "/etc/skel/$name" || { echo 'Demo home contains non-bootstrap data; preserve it' >&2; exit 1; }
      mv -- "$entry" "/var/lib/airlock-demo-skels/$name"
    done
  fi
  truncate -s 48G /var/lib/airlock-demo-root.img
  chmod 0600 /var/lib/airlock-demo-root.img
  mkfs.ext4 -q -F /var/lib/airlock-demo-root.img
fi
mount_unit=$(systemd-escape --path --suffix=mount /var/lib/airlock-demo)
cat > "/etc/systemd/system/$mount_unit" <<'UNIT'
[Unit]
Description=Finite persistent Airlock demo filesystem
Before=local-fs.target
[Mount]
What=/var/lib/airlock-demo-root.img
Where=/var/lib/airlock-demo
Type=ext4
Options=loop,nosuid,nodev
[Install]
WantedBy=local-fs.target
UNIT
install -d "/etc/systemd/system/user-$demo_uid.slice.d" "/etc/systemd/system/user@$demo_uid.service.d"
cat > "/etc/systemd/system/user-$demo_uid.slice.d/90-airlock-demo-budget.conf" <<'UNIT'
[Slice]
MemoryHigh=8G
MemoryMax=12G
MemorySwapMax=0
CPUQuota=400%
TasksMax=4096
IOWeight=10
IOReadBandwidthMax=/dev/nvme0n1 128M
IOWriteBandwidthMax=/dev/nvme0n1 32M
UNIT
cat > "/etc/systemd/system/user@$demo_uid.service.d/90-airlock-demo-mount.conf" <<'UNIT'
[Unit]
RequiresMountsFor=/var/lib/airlock-demo
[Service]
Delegate=cpu cpuset io memory pids
UNIT
systemctl daemon-reload
systemctl enable --now "$mount_unit"
chown airlock-demo:airlock-demo /var/lib/airlock-demo
chmod 0700 /var/lib/airlock-demo
loginctl enable-linger airlock-demo
systemctl start "user@$demo_uid.service"
if [[ ! -S /run/user/$demo_uid/docker.sock ]]; then
  sudo -u airlock-demo env XDG_RUNTIME_DIR="/run/user/$demo_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$demo_uid/bus" /usr/bin/dockerd-rootless-setuptool.sh install --force
fi
sudo -u airlock-demo env XDG_RUNTIME_DIR="/run/user/$demo_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$demo_uid/bus" systemctl --user enable --now docker.service
sudo -u airlock-demo env DOCKER_HOST="unix:///run/user/$demo_uid/docker.sock" docker info --format 'Rootless demo Docker: root={{.DockerRootDir}} driver={{.CgroupDriver}}'
printf 'Demo UID=%s; persistent disk48GiB;RAM high8/max12GiB;CPU4;swap0;tasks4096\n' "$demo_uid"
