# Time to detect

One row per fault run. Fill in the timestamps (UTC, ISO). `bun run fault status` prints the first two columns for faults that are on; `faults/LOG.md` has every toggle with the git sha at that time.

| Fault id | Switched on at | Deployed at (commit, time) | First audit started | First audit completed | Finding first reported | Issue first created | Notification sent | Switched off | Finding resolved | Issue closed |
| -------- | -------------- | -------------------------- | ------------------- | --------------------- | ---------------------- | ------------------- | ----------------- | ------------ | ---------------- | ------------ |
|          |                |                            |                     |                       |                        |                     |                   |              |                  |              |

Derived: detect = finding first reported minus deployed; notify = notification sent minus finding first reported; close = issue closed minus switched off (deployed again).
