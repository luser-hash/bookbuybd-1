# PrintingHub Potential API Endpoints

Base path: `/api`

## 1) Categories for dropdown + pills
- `GET /printing/categories/`

Response example:
```json
[
  {
    "id": "books",
    "label": "Books & Academic",
    "icon": "📚",
    "items": [
      { "id": "thesis", "name": "Thesis & Dissertations", "description": "Hard/soft cover thesis binding", "icon": "🎓" }
    ]
  }
]
```

## 2) Items by category (optional if categories already include items)
- `GET /printing/categories/{categoryId}/items/`

## 3) Price estimate before submission
- `POST /printing/requests/estimate/`

Request body:
```json
{
  "categoryId": "books",
  "itemIds": ["thesis"],
  "quantity": 100,
  "emergency": false
}
```

Response body:
```json
{
  "estimatedTotal": 8500,
  "currency": "BDT",
  "minimumLeadDays": 2,
  "maximumLeadDays": 4
}
```

## 4) Submit print request
- `POST /printing/requests/`

Request body:
```json
{
  "categoryId": "books",
  "itemIds": ["thesis"],
  "quantity": 100,
  "budget": 10000,
  "requiredBy": "2026-03-20",
  "notes": "Matte finish, A4, blue cover.",
  "emergency": false,
  "assetUrls": ["https://cdn.example.com/uploads/file-1.pdf"]
}
```

Response body:
```json
{
  "requestId": "pr_01JXYZ",
  "status": "received",
  "submittedAt": "2026-03-10T10:20:30Z"
}
```

## 5) Request status (for tracking)
- `GET /printing/requests/{requestId}/`

## 6) Design upload URL (pre-signed upload flow)
- `POST /printing/uploads/presign/`

Request body:
```json
{
  "fileName": "design.pdf",
  "contentType": "application/pdf",
  "sizeInBytes": 234221
}
```

Response body:
```json
{
  "uploadUrl": "https://storage.example.com/presigned-put-url",
  "fileUrl": "https://cdn.example.com/uploads/design.pdf",
  "expiresAt": "2026-03-10T10:30:30Z"
}
```
