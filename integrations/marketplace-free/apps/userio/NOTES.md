# UserIO demo
Native SDK0.7.0, MVC scaffold, original live UserIO API. Separate user and managed read-only IMAP account; exactly one delivered training email. No production UserIO source/config/restart changes. Native account AI opt-out before connect, all automatic kinds ignored, send/subscribe/download false. App credential is an additional native read_only personal token, never owner or personal-mail access.

The operator sent exactly one service-mail-to-demo message, preserved Message-ID before DATA, verified SMTP acceptance and independent IMAP body/UID readback, then actual UserIO poller mirror. No data injection or mock provider. App checks exact account/conversation/provider ID/sender/content hash and drops all other messages; fixed read-only API path and admin-only raw connection. No sends, reply tools, arbitrary paths or input. Cached output/quota persist in Agent.DB; twelve reads/hour.

Only source/manifest/parser tests are local evidence; completion requires native build + binding + guest form/chat + permissions + headed light/dark/mobile. Access backups: primary0600, second copy100 and Yandex.Disk with readback, outside Git. Update fixed message only after a new authorized real provider receipt, not by editing expected content alone.

Source1GiB/CPU2/tasks128/swap0/temp2GiB expected60/max600s. Native demo88 aggregate8/12GiB/app1GiB/BuildKit4GiBCPU2 onebuild. Browser44/88 only, finite unit. No Airlock core or private RU frontend changes.
