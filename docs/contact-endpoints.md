# Contact Potential API Endpoints

Base path: `/api`

## 1) Contact info card data
- `GET /contact/info`

Response example:
```json
{
  "phone": "+880 1712-345678",
  "email": "support@bookbuybd.com",
  "address": "Dhaka, Bangladesh",
  "mapEmbedUrl": "https://www.google.com/maps/embed?...",
  "supportHours": "Sat-Thu 10:00-20:00"
}
```

## 2) Subject dropdown options (optional)
- `GET /contact/subjects`

Response example:
```json
[
  { "id": "general", "label": "General Inquiry" },
  { "id": "order", "label": "Order Support" },
  { "id": "printing", "label": "Printing Service" }
]
```

## 3) Preferred date availability (optional)
- `GET /contact/availability?date=2026-03`

Response example:
```json
[
  { "date": "2026-03-10", "isAvailable": true },
  { "date": "2026-03-11", "isAvailable": false, "note": "Public holiday" }
]
```

## 4) Submit contact form
- `POST /contact/messages`

Request body:
```json
{
  "name": "Arif Billah",
  "email": "arif@example.com",
  "subject": "Printing quote",
  "message": "Need 200 copies of thesis print and bind.",
  "preferredDate": "2026-03-20"
}
```

Response body:
```json
{
  "messageId": "msg_01JXYZ",
  "status": "received",
  "submittedAt": "2026-03-10T10:20:30Z"
}
```

## 5) Message status (optional follow-up)
- `GET /contact/messages/{messageId}`

Response body:
```json
{
  "messageId": "msg_01JXYZ",
  "status": "in_review",
  "updatedAt": "2026-03-10T11:20:30Z"
}
```
