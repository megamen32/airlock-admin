# UserIO: IMAP Date -0000 shifts time on a Moscow-time host

Confirmed 15Oct2026 through the real native user-owned IMAP poller, not a mock.
Canonical source: universal-userio/src/universal_userio/account_connections.py,
UserAccountPoller.poll_imap, parsedate_to_datetime(...).timestamp().

Actual email Date: Thu, 15 Oct 2026 06:43:20 -0000.
Independent IMAP INTERNALDATE: 15-Oct-2026 09:43:22 +0300.
UserIO received_at renders 03:43:20 UTC, three hours early. parsedate_to_datetime
returns a naive datetime for -0000; timestamp() treats it as host-local MSK.
[Python documentation](https://docs.python.org/3/library/email.utils.html#email.utils.parsedate_to_datetime)
confirms that a conforming -0000 Date represents UTC with an unknown source
zone. A control email with an aware GMT Date is separately verified.

Private evidence: airlock-admin/.tmp/userio-demo-20261015/date-diagnostic.json,
date-control-proof.json, IMAP/provider receipts. Both actual messages are
preserved. The control has its own unique Message-ID and AIRLOCK-MAIL-002 body;
it is a distinct diagnostic send, not replay of the accepted first message.

Airlock mitigation: whitelist only the actually received GMT control after
independent IMAP and UserIO timestamp agreement. Cache is tied to selected
content, so the earlier prepared result cannot remain after source update.
No adjusted, invented or hardcoded replacement timestamp is shown.

Upstream fix remains required for general -0000 IMAP messages: handle the
naive parse as UTC explicitly before timestamp(); keep aware offsets unchanged.
Verify -0000/GMT/+0300, malformed and missing Date on a non-UTC host, then an
actual provider readback. Existing historical rows need deliberate reconciliation,
not replayed ingestion or global rewriting. This is a UserIO-owned source fix;
its active source owner and no-core/restart Airlock integration boundary prevent
changing it as part of this demo. No UserIO source or API restart was performed.
