# Reflection

## Most Difficult Concept
The hardest concept for me was database design and data relations, which tied together the User Directory and Library API projects. Deciding how users and books relate (one-to-many versus many-to-many) was confusing, and I struggled to see how a well-structured schema shapes the API endpoints, the client-server requests over HTTPS, and the data the DOM finally renders. I overcame this by sketching entity diagrams before writing code, using foreign keys to link records, and testing each endpoint with sample requests. Comparing server-side storage with browser storage (localStorage) also clarified what data belongs where and why.

## What I Would Improve
Based on the feedback I received, I would add an `aria-describedby` attribute to the QuickNotes title input that references the status message container. Currently, validation and network errors appear visually, but assistive technologies may not announce them. Linking the input to the container, and giving it `role="status"` or `aria-live="polite"`, ensures screen readers announce errors the moment input validation fails. I would also set `aria-invalid="true"` on failure and test with a screen reader such as NVDA, so accessibility is part of the design rather than an afterthought.

## What I Will Learn Next
Having gained a strong interest in databases and data relations, I want to study relational databases in depth: SQL joins, normalization, indexing, and transactions with PostgreSQL. I also plan to learn an ORM such as Prisma to connect my backend to a real database, and to apply that knowledge by extending QuickNotes with user accounts and tagged notes.