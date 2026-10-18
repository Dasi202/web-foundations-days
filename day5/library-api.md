# Library Books REST API Design

Base URL: `/api/v1`

Resource: `books`. Each book has `id`, `title`, `author`, `isbn`, `publishedYear` and `available`.

## Endpoints

### 1. List books
- **Method:** GET
- **Path:** `/books`
- **Description:** Returns all books in the library.
- **Request body:** none
- **Success status:** 200 OK

### 2. Get one book
- **Method:** GET
- **Path:** `/books/{id}`
- **Description:** Returns the single book with the given id.
- **Request body:** none
- **Success status:** 200 OK

### 3. Create a book
- **Method:** POST
- **Path:** `/books`
- **Description:** Adds a new book to the library.
- **Example request body:**
  ```json
  {
    "title": "Clean Code",
    "author": "Robert C. Martin",
    "isbn": "9780132350884",
    "publishedYear": 2008
  }
  ```
- **Success status:** 201 Created

### 4. Update a book (full replace)
- **Method:** PUT
- **Path:** `/books/{id}`
- **Description:** Replaces all fields of an existing book.
- **Example request body:**
  ```json
  {
    "title": "Clean Code",
    "author": "Robert C. Martin",
    "isbn": "9780132350884",
    "publishedYear": 2008,
    "available": false
  }
  ```
- **Success status:** 200 OK

### 5. Update a book (partial)
- **Method:** PATCH
- **Path:** `/books/{id}`
- **Description:** Changes only the fields sent, such as availability.
- **Example request body:**
  ```json
  { "available": true }
  ```
- **Success status:** 200 OK

### 6. Delete a book
- **Method:** DELETE
- **Path:** `/books/{id}`
- **Description:** Removes the book from the library.
- **Request body:** none
- **Success status:** 204 No Content

### 7. List books by an author
- **Method:** GET
- **Path:** `/books?author=Robert%20C.%20Martin`
- **Description:** Returns only the books written by the author given in the `author` query parameter.
- **Request body:** none
- **Success status:** 200 OK

## Error codes

### 400 Bad Request
- The client sent invalid data, so the server cannot process it.
- **Example:** `POST /books` with a body that has no `title`, or with `publishedYear` set to `"abc"`.
- **Example:** `PUT /books/abc` where the id is not a valid number.

### 404 Not Found
- The requested resource does not exist.
- **Example:** `GET /books/9999` when no book has id 9999.
- **Example:** `DELETE /books/42` for a book that was already deleted.