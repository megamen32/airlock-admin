# UserIO demo
Native SDK0.7.0, MVC scaffold, original live UserIO API. Separate user and managed read-only IMAP account; exactly one delivered training email. No production UserIO source/config/restart changes. Native account AI opt-out before connect, all automatic kinds ignored, send/subscribe/download false. App credential is an additional native read_only personal token, never owner or personal-mail access.

The operator sent one initial training email and one distinct GMT date-control email after finding the upstream -0000 timezone defect. Both receipts remain. The selected AIRLOCK-MAIL-002 has exact SMTP250, IMAP body/UID and UserIO timestamp readback. No original send was replayed. Only the selected message appears in the app; cache identity follows its content hash. No data injection or mock provider. App checks exact account/conversation/provider ID/sender/content hash and drops all other messages; fixed read-only API path and admin-only raw connection. No sends, reply tools, arbitrary paths or input. Cached output/quota persist in Agent.DB; twelve reads/hour.

Only source/manifest/parser tests are local evidence; completion requires native build + binding + guest form/chat + permissions + headed light/dark/mobile. Access backups: primary0600, second copy100 and Yandex.Disk with readback, outside Git. Update fixed message only after a new authorized real provider receipt, not by editing expected content alone.

Source1GiB/CPU2/tasks128/swap0/temp2GiB expected60/max600s. Native demo88 aggregate8/12GiB/app1GiB/BuildKit4GiBCPU2 onebuild. Browser44/88 only, finite unit. No Airlock core or private RU frontend changes.

Upstream -0000 timestamp issue is recorded in registrations/userio-imap-date-issue.md. General UserIO parsing remains owner work; this app selects the verified GMT email and does not invent or adjust dates.
