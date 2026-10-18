# SnapShare Scaling Plan

SnapShare is a photo-sharing app where users upload photos and scroll a feed of photos from people they follow. This document sizes the system and proposes an architecture that can handle the load.

## 1. Assumptions and Daily Active Users

| # | Assumption | Value |
|---|------------|-------|
| A1 | Registered users | 10,000,000 |
| A2 | Share of users active each day | 10% |
| A3 | Uploads per active user per day | 1 photo |
| A4 | Feed page views per active user per day | 50 |
| A5 | Average original photo size | 2 MB |
| A6 | Thumbnail size per photo | 50 KB |
| A7 | Peak traffic multiplier | 5x the average |
| A8 | Seconds in a day | 86,400 |
| A9 | Units | Decimal (1 MB = 1,000 KB, 1 TB = 1,000,000 MB) |

**Daily active users (DAU)**

```
DAU = 10,000,000 x 10% = 1,000,000 users per day
```

## 2. Calculations

### Uploads per second

```
Uploads per day   = 1,000,000 users x 1 photo      = 1,000,000 uploads/day
Average uploads/s = 1,000,000 / 86,400             = ~11.6 uploads/s
Peak uploads/s    = 11.6 x 5                       = ~58 uploads/s
```

### Feed views per second

```
Feed views per day = 1,000,000 users x 50 pages    = 50,000,000 views/day
Average views/s    = 50,000,000 / 86,400           = ~579 views/s
Peak views/s       = 579 x 5                       = ~2,895 views/s  (about 2,900)
```

### Photo storage per year

```
Originals per day   = 1,000,000 x 2 MB   = 2,000,000 MB  = 2 TB/day
Thumbnails per day  = 1,000,000 x 50 KB  = 50,000,000 KB = 50 GB/day
Total per day       = 2 TB + 0.05 TB     = 2.05 TB/day

Originals per year  = 2 TB x 365         = 730 TB
Thumbnails per year = 0.05 TB x 365      = 18.25 TB
Total per year      = 730 + 18.25        = 748.25 TB  (about 0.75 PB)
```

### Summary

| Metric | Average | Peak (5x) |
|--------|---------|-----------|
| Uploads per second | ~11.6 | ~58 |
| Feed views per second | ~579 | ~2,895 |
| Photo storage per year | ~748 TB (730 TB originals + 18.25 TB thumbnails) | n/a |

### Extra estimates (additional assumption: 1 feed page shows 10 thumbnails)

```
Download bandwidth, average = 579 views/s x 10 thumbs x 50 KB = ~289 MB/s (~2.3 Gbps)
Download bandwidth, peak    = 289 MB/s x 5                    = ~1.4 GB/s (~11.6 Gbps)
Upload bandwidth, average   = 11.6 uploads/s x 2 MB           = ~23 MB/s
Upload bandwidth, peak      = 58 uploads/s x 2 MB             = ~116 MB/s
Metadata rows per year      = 1,000,000 x 365                 = 365 million rows
Metadata size per year      = 365 million x ~1 KB             = ~365 GB
```

These numbers show that the photo bytes (hundreds of terabytes) are far larger than the metadata (hundreds of gigabytes), and that thumbnail delivery needs a CDN.

## 3. Read-Heavy or Write-Heavy?

**SnapShare is read-heavy.** Feed views are 50 per user per day and uploads are 1 per user per day, so reads outnumber writes by about **50 to 1** (579 views/s vs 11.6 uploads/s on average). The gap is even larger in bytes served.

What this means for the design:

- **Cache aggressively:** keep hot feed data and photo metadata in an in-memory cache so most reads never reach the database.
- **Use a CDN** to serve photo files from locations near the user.
- **Scale reads with read replicas** so the primary database mostly handles writes.
- **Keep app servers stateless** so we can add more behind a load balancer as read traffic grows.
- **Move slow write work (thumbnails) off the request path** using a queue, so uploads stay fast.
- Writes still matter: each upload is 2 MB, so the upload path must be reliable and not block readers.

## 4. Why Photos Must Not Be Stored in the Database

Photo files should **not** live inside the database because:

1. **Size and cost:** about 730 TB of originals per year would make the database huge and expensive, since database storage is costly and hard to scale.
2. **Performance:** large binary blobs bloat tables, slow queries, backups and replication, and compete with the small, frequent metadata queries.
3. **Replication lag:** every 2 MB photo would have to be copied to every read replica.
4. **Poor delivery:** a database cannot serve files over HTTP to a CDN efficiently.

**Where they go instead:** **object storage** (such as Amazon S3 or Google Cloud Storage), which is cheap, durable, and practically unlimited. The database only stores **metadata**: photo ID, owner ID, the object storage key/URL, upload time, and processing status. Files are then delivered to users through the **CDN**.

## 5. Architecture Diagram
 
```
            +-----------------------------------------------+
            |             USERS (mobile / web)              |
            +---------+---------------------------+---------+
                      |                           |
                      | (1) photo GETs            | (2) API calls
                      |                           | feed / upload
                      v                           v
                +-----------+            +-----------------+
                |    CDN    |            |  LOAD BALANCER  |
                +-----------+            +-----------------+
                      |                           |
                      |                           v
                      | (cache miss)   +---------------------+
                      |                |   APP SERVERS x N   |
                      |                |     (stateless)     |
                      |                +---------------------+
                      |                           |
                      |        +------------------+-------------------+
                      |        v                  v                   v
                      | +-------------+   +---------------+   +---------------+
                      | |    CACHE    |   |   DATABASE    |   |     QUEUE     |
                      | |   (Redis)   |   | PRIMARY (R/W) |   | (thumb. jobs) |
                      | +-------------+   +---------------+   +---------------+
                      |        |                  |                   |
                      |        |                  | replication       |
                      |        | (3) on miss      v                   v
                      |        |          +---------------+   +---------------+
                      |        +--------->| READ REPLICA  |   |   THUMBNAIL   |
                      |                   +---------------+   |   WORKER(S)   |
                      |                                       +---------------+
                      |                           (5) read original,  |
                      |                           write thumbnail     |
                      v                                               v
            +-----------------------------------------------------------------+
            |                    OBJECT STORAGE (S3-style)                    |
            |              originals ~2 MB  +  thumbnails ~50 KB              |
            +-----------------------------------------------------------------+
```
 
**How to read the diagram**
 
| Label | Path | What happens |
|-------|------|--------------|
| (1) | Users -> CDN -> Object Storage | Photo and thumbnail files are served from the CDN edge; only a cache miss reaches object storage. |
| (2) | Users -> Load Balancer -> App Servers | Every API call (load feed, upload, follow) is spread across stateless app servers. |
| (3) | App Servers -> Cache -> Read Replica | Feed reads check the cache first and go to the read replica only on a miss. |
| (4) | App Servers -> Primary DB, Queue, Object Storage | Writes: the app server saves photo metadata to the primary database, enqueues a thumbnail job, and gives the client a pre-signed URL so the 2 MB original is uploaded straight to object storage. |
| (5) | Queue -> Thumbnail Workers -> Object Storage | Workers pull jobs, read the original, write the 50 KB thumbnail, and update the database. |
 
The primary database replicates to the read replica, so reads and writes are served by different machines.
## 6. Components

- **CDN:** it solves slow and expensive photo delivery by caching photos at edge locations close to users, which also removes most download traffic from our servers.
- **Load Balancer:** it solves the single-point-of-failure and overload problem by spreading incoming requests across many app servers and skipping unhealthy ones.
- **App Servers:** they solve the need to run business logic (authentication, upload handling, feed building) in a stateless way, so we can scale horizontally by simply adding more servers.
- **Cache (Redis):** it solves database overload from repeated reads by keeping hot data such as feeds and photo metadata in fast memory.
- **Database (primary):** it solves the need for reliable, consistent storage of users, follows, and photo metadata, and handles all writes.
- **Read Replica:** it solves read bottlenecks by serving feed queries from a copy of the primary, leaving the primary free for writes.
- **Object Storage:** it solves the problem of storing hundreds of terabytes of photo files cheaply, durably, and at nearly unlimited scale.
- **Queue:** it solves slow uploads and traffic spikes by letting the app server hand off thumbnail work and reply to the user immediately.
- **Thumbnail Worker:** it solves slow-loading feeds by generating small 50 KB thumbnails from 2 MB originals in the background, and workers can be scaled independently.

## 7. Upload Flow, Step by Step

1. The user selects a photo in the app and taps **Upload**.
2. The request goes through the **load balancer** to an **app server**.
3. The app server authenticates the user and validates the request (file type, size limit).
4. The app server returns a short-lived **pre-signed URL** for **object storage**, so the 2 MB file does not pass through the app server.
5. The client uploads the **original photo directly to object storage**.
6. The client tells the app server the upload is complete, and the app server verifies the file exists.
7. The app server writes a **metadata row** to the **primary database** (photo ID, user ID, storage key, timestamp, status = `processing`).
8. The app server puts a **"create thumbnail" job** (photo ID and storage key) on the **queue**.
9. The app server immediately responds **"upload successful"** to the user, so the user does not wait for thumbnail creation.
10. A **thumbnail worker** takes the job from the queue and downloads the original from object storage.
11. The worker resizes the image to a **~50 KB thumbnail** and saves it to object storage.
12. The worker updates the database row (status = `ready`, thumbnail key saved). If the job fails, it is retried from the queue (and sent to a dead-letter queue after repeated failures).
13. The relevant caches (the uploader's feed and their followers' feeds) are invalidated or refreshed.
14. Followers load the feed: metadata comes from the **cache / read replica**, and thumbnails come from the **CDN**.

## 8. Trade-offs

1. **Eventual consistency from the read replica.** Reads from a replica can be slightly behind the primary, so a new photo may not appear instantly in a follower's feed. We accept this small delay for much higher read capacity, and can read the uploader's own photos from the primary so they see their upload right away.
2. **Cache speed vs. stale data and complexity.** The cache makes feeds fast and protects the database, but cached feeds can be out of date and cache invalidation is hard to get right. We accept short TTLs (for example 30-60 seconds) and explicit invalidation on upload.
3. **Asynchronous thumbnails: fast uploads vs. a short delay.** The queue keeps uploads fast and absorbs spikes, but a photo has no thumbnail for a few seconds and we must run and monitor extra workers and handle retries. We can show a placeholder or the original until the thumbnail is ready.
4. **CDN cost and freshness vs. speed.** A CDN greatly reduces latency and origin load but adds cost, and deleted or changed photos may stay cached until they expire or are purged. Cost is justified by the ~2.3 Gbps average (about 11.6 Gbps at peak) of thumbnail traffic.
5. **More components mean more operational complexity.** Each added piece (cache, queue, workers, replica) is another thing to deploy, monitor, and debug, which is the price paid for scalability and reliability.

## Conclusion

With 1 million daily active users, SnapShare needs to handle roughly 12 uploads/s (58 at peak), about 579 feed views/s (about 2,900 at peak), and around 748 TB of photo storage per year. Because the system is read-heavy, the design leans on a CDN, a cache, and read replicas for reads, while object storage plus a queue and thumbnail workers keep the write path fast and the database small.