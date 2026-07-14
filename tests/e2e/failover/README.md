# GPTAdmin failover Docker black-box suite

Run from the repository root:

```bash
docker compose -f tests/e2e/failover/docker-compose.yml up --build --abort-on-container-exit --exit-code-from failover-e2e
```

The suite runs two real Go hubs, the real failover watchdog and proxy, and a
controlled ingress. It verifies three independent failure modes:

- tunnel failure while the primary hub is healthy;
- primary hub failure while the tunnel remains live;
- primary hub and tunnel failure together, followed by tunnel recovery.
- signed reclaim after primary recovery, which demotes the fallback route.

The ingress and FRP client are test doubles because an external FRP server is
not part of this repository. The FRP double exposes only the observable
contract required by the watchdog: promotion routes public ingress to fallback
and demotion removes that route.
