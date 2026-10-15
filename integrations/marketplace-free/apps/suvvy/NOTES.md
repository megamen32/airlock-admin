# Савви в Airlock
Native SDK0.7.0 MVC app. Separate vendor demo agent; no core modifications.
Personal API accepts a message and returns asynchronously through the native bearer-verified webhook.
One question per ordinary Airlock user; fixed persistent global4/hour20total cap; no dispatch after22Oct2026MSK.
Reserve before I/O. UUID is both chat_id and message_id. Unknown/in-flight never replay. Callback joins AI text only, correlates exact admitted run, duplicate same answer is harmless. Credential is an Admin-only Connection; never source/browser/guest tool.
Theme winter/night via existing native DaisyUI. System font, no external fonts. Two-panel question/result layout; mobile stacks, natural wrapping. No request at page open.
Tests: fast unit decoding/size/sender/correlation input/Unicode length, expected1s maximum10s. Native live acceptance must prove callback plus guest web and chat, not only POST200.

Source budget100: one SDK build then focused unit, GOMAXPROCS2, CPU200%, MemoryHigh/Max1GiB, swap0, Tasks128, IOWeight10, emergency wall3000s; expected source build30s and native build300s. Fresh available20GiB on100, prior same SDK peak699MiB. Native app retains1GiB/noswap/Tasks1024 inside UID9938–12GiB/CPU4 aggregate; one native build. No new daemons.
