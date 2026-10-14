# Priceva native reader — not yet accepted for prices
Official SDK: https://github.com/priceva/priceva-api-sdk-php , base https://api.priceva.com/api/v1/; POST, Apikey raw token, JSON params.
Native encrypted Connection priceva AccessAdmin; user only fixed price_monitor callback/form.
Calls product/list,source/list,report/list, first page max20 each; no imports, repricing, writes or on-demand collection.
Provider JSON errors must be checked despiteHTTP200. Original Assortment campaign key returned403accounttype; new CompetitorPriceMonitoring campaign3jb key still returned401 on14Oct2026, campaignonmoderation. Do not claim realprices/workingreader until provider accepts actual data.
Template returns only verified list envelope counts after successful data response, never substitutes auth failure with zero or fake products/prices. Actual price item fields remain unknown, so no parser is claimed.
Cache2min (including rejection state), persisted4refresh/hour, one active,60stotal/20spermethod,1MiBresponse cap, native PostgreSQL migrations.
User authorized separate free campaign creation in personal M1Chrome; prior campaign preserved. No personal contact/auth data is in source.
