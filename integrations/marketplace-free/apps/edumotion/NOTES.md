# Edumotion demo connector

Official Swagger https://api.edumotion.ru/docs/public-api, checked15Oct2026.
Fixed read-only GET /public/api/v1/courses?page=1&pageSize=20, X-Api-Key
injected by native encrypted Connection. Raw connection is AccessAdmin; guests
only call typed training_catalog and its HTML form. No user, assignment or
learning-path write APIs are exposed. Only course IDs/titles and real total
from the public API are projected; failure omits total instead of inventing0.

Dedicated Airlock organization; the credential file's old base_url/public/v1
was inaccurate, official path /public/api/v1 verified by a real200 response.
Actual initial catalogue is empty. No fake courses are inserted in the UI.
14-day Professional trial started15Oct2026, without card or auto-billing;
this is not a permanent free API tier. When trial ends provider failure remains
explicitly unavailable, not an empty catalogue or a paid fallback.

Persistent PostgreSQL cache5min,12provider calls/hour,1active request,20s
provider deadline,512KiBresponse cap,20course titles per page. App stays1GiB,
one native build at a time in the existing demo88 BuildKit4GiB/2CPU budget.
Secrets and private registration/browser material never belong in source.
