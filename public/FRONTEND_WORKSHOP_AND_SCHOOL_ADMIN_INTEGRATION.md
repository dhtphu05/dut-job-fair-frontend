# Tích Hợp Frontend Cho Hội Thảo Và School Admin

Tài liệu này dành cho frontend triển khai 2 phần mới:

- Màn hình báo cáo, điểm danh cho tài khoản hội thảo
- Tab riêng cho hội thảo trong tài khoản school admin

Mục tiêu:

- Tài khoản hội thảo có thể xem nhanh danh sách sinh viên đã check-in
- Tài khoản hội thảo có thể xuất file Excel hoặc CSV phục vụ điểm danh
- School admin có thể tách riêng hội thảo ra khỏi booth doanh nghiệp trong dashboard và thống kê

## 1. Base URL

- Base URL backend: `https://your-domain.com/api`
- Prefix báo cáo hội thảo: `/business-admin`
- Prefix school admin: `/school-admin`

Tất cả API bên dưới đều cần Bearer token.

## 2. Role Và Phạm Vi Truy Cập

### Tài khoản hội thảo

Tài khoản hội thảo vẫn đang dùng role:

- `business_admin`

Nhưng tài khoản này được gán vào một `booth` có:

- `type = workshop`

Backend tự động lấy `boothId` từ token khi gọi API báo cáo hội thảo. Frontend hội thảo không cần truyền `boothId`.

### School admin

Có thể gọi:

- `GET /api/school-admin/dashboard`
- `GET /api/school-admin/stats`
- `GET /api/school-admin/booths`
- `GET /api/school-admin/booth-stats`
- `GET /api/school-admin/checkins`

Để tách dữ liệu hội thảo, frontend cần dựa vào field `type`.

## 3. API Cho Tài Khoản Hội Thảo

### 3.1. Lấy Danh Sách Điểm Danh Hội Thảo

API:

`GET /api/business-admin/workshop-attendance`

Response mẫu:

```json
{
  "data": {
    "workshop": {
      "id": "booth-id",
      "name": "Hội thảo CV Ấn tượng – Phỏng vấn tự tin",
      "displayName": "Hội thảo Kỹ năng chuyên đề “CV Ấn tượng – Phỏng vấn tự tin”",
      "location": "Khu hội thảo - Phòng WS01",
      "business": "Hội thảo Kỹ năng chuyên đề “CV Ấn tượng – Phỏng vấn tự tin”",
      "type": "workshop"
    },
    "total": 3,
    "items": [
      {
        "stt": 1,
        "studentId": "student-id",
        "workshopName": "Hội thảo Kỹ năng chuyên đề “CV Ấn tượng – Phỏng vấn tự tin”",
        "fullName": "Nguyễn Văn A",
        "studentCode": "102230313",
        "className": "23T_DT4",
        "department": "Khoa Công nghệ Thông tin",
        "phone": "0385544281",
        "checkInTime": "2026-04-01 08:15:23"
      }
    ]
  },
  "status": 200
}
```

Frontend nên ưu tiên dùng:

- `workshop.displayName`
- `items[].workshopName`

để hiển thị tên hội thảo đầy đủ, chuẩn theo dữ liệu:

`Hội thảo Kỹ năng chuyên đề “CV Ấn tượng – Phỏng vấn tự tin”`

### 3.2. Xuất CSV Điểm Danh Hội Thảo

API:

`GET /api/business-admin/workshop-attendance/export`

Các cột dữ liệu:

- `STT`
- `Tên hội thảo`
- `Họ và tên`
- `MSSV`
- `Lớp`
- `Khoa`
- `SĐT`
- `Thời gian điểm danh`

### 3.3. Xuất Excel Điểm Danh Hội Thảo

API:

`GET /api/business-admin/workshop-attendance/export/excel`

Các cột dữ liệu:

- `STT`
- `Tên hội thảo`
- `Họ và tên`
- `MSSV`
- `Lớp`
- `Khoa`
- `SĐT`
- `Thời gian điểm danh`

Tên sheet Excel:

- `Điểm danh hội thảo`

### 3.4. Thêm Sinh Viên Bằng Tay

API:

`POST /api/business-admin/workshop-attendance/manual`

Body mẫu:

```json
{
  "fullName": "Nguyễn Văn A",
  "studentCode": "102230000",
  "className": "23T_DT3",
  "department": "Khoa Công nghệ Thông tin",
  "phone": "0123456789",
  "email": "example@gmail.com",
  "checkInTime": "2026-04-01T08:15:23+07:00"
}
```

Lưu ý:

- `fullName` và `studentCode` là bắt buộc
- `checkInTime` là tùy chọn
- nếu không truyền `checkInTime`, backend dùng thời gian hiện tại
- backend tự tính `year` từ MSSV
- backend không dùng `major`
- nếu MSSV đã tồn tại, backend sẽ cập nhật lại thông tin sinh viên theo dữ liệu form mới
- nếu sinh viên đã có trong danh sách điểm danh của hội thảo đó rồi, backend trả lỗi `400`

Response thành công:

```json
{
  "data": {
    "message": "Đã thêm sinh viên vào danh sách điểm danh hội thảo",
    "workshop": {
      "id": "booth-id",
      "name": "Hội thảo CV Ấn tượng – Phỏng vấn tự tin",
      "displayName": "Hội thảo Kỹ năng chuyên đề “CV Ấn tượng – Phỏng vấn tự tin”",
      "type": "workshop"
    },
    "item": {
      "stt": 15,
      "studentId": "student-id",
      "workshopName": "Hội thảo Kỹ năng chuyên đề “CV Ấn tượng – Phỏng vấn tự tin”",
      "fullName": "Nguyễn Văn A",
      "studentCode": "102230000",
      "className": "23T_DT3",
      "department": "Khoa Công nghệ Thông tin",
      "phone": "0123456789",
      "checkInTime": "2026-04-01 08:15:23"
    }
  },
  "status": 201
}
```

### 3.5. Xoá Sinh Viên Khỏi Danh Sách Điểm Danh

API:

`DELETE /api/business-admin/workshop-attendance/:studentCode`

Ví dụ:

`DELETE /api/business-admin/workshop-attendance/102230000`

Response thành công:

```json
{
  "data": {
    "message": "Đã xoá sinh viên khỏi danh sách điểm danh hội thảo",
    "deletedStudentCode": "102230000",
    "deletedCheckins": 1,
    "workshop": {
      "id": "booth-id",
      "name": "Hội thảo CV Ấn tượng – Phỏng vấn tự tin",
      "displayName": "Hội thảo Kỹ năng chuyên đề “CV Ấn tượng – Phỏng vấn tự tin”",
      "type": "workshop"
    }
  },
  "status": 200
}
```

Lưu ý:

- thao tác xoá đang xoá toàn bộ check-in của MSSV đó trong hội thảo hiện tại
- vì danh sách workshop đang unique theo sinh viên, đây là hành vi đúng với UI danh sách

### 3.6. UI Đề Xuất Cho Tài Khoản Hội Thảo

Frontend nên có 3 nhóm action ở đầu bảng:

- `Tải Excel`
- `Tải CSV`
- `Thêm bằng tay`

Trong bảng điểm danh, mỗi dòng nên có thêm action:

- `Xoá`

### 3.7. Flow Modal Thêm Bằng Tay

Đề xuất form:

- `Họ và tên` - bắt buộc
- `MSSV` - bắt buộc
- `Lớp`
- `Khoa`
- `SĐT`
- `Email`
- `Thời gian điểm danh`

Hành vi UI:

1. User bấm `Thêm bằng tay`
2. Mở modal form
3. Submit tới `POST /api/business-admin/workshop-attendance/manual`
4. Nếu thành công:
   - đóng modal
   - gọi lại `GET /api/business-admin/workshop-attendance`
   - hoặc chèn `item` mới vào bảng rồi đánh lại `STT`
5. Nếu lỗi `400` vì trùng:
   - hiển thị thông báo `Sinh viên này đã có trong danh sách điểm danh của hội thảo`

### 3.8. Flow Xoá Khỏi Danh Sách

Hành vi UI:

1. User bấm `Xoá` ở một dòng
2. Mở confirm dialog
3. Nội dung xác nhận nên có:
   - họ tên
   - MSSV
   - tên hội thảo
4. Nếu xác nhận:
   - gọi `DELETE /api/business-admin/workshop-attendance/:studentCode`
5. Nếu thành công:
   - reload lại danh sách
   - hoặc xoá local row rồi đánh lại `STT`

Đề xuất câu xác nhận:

`Bạn có chắc muốn xoá sinh viên này khỏi danh sách điểm danh hội thảo không?`

## 4. School Admin: Tab Riêng Cho Hội Thảo

Frontend school admin nên tách riêng:

- `Booth doanh nghiệp`
- `Hội thảo`

Từ các API hiện có:

- `GET /api/school-admin/dashboard`
- `GET /api/school-admin/stats`
- `GET /api/school-admin/booth-stats`
- `GET /api/school-admin/checkins`

Các field cần ưu tiên:

- `type`
- `displayName`

Với workshop, ưu tiên hiển thị:

`displayName = Hội thảo Kỹ năng chuyên đề “CV Ấn tượng – Phỏng vấn tự tin”`

thay vì tên booth ngắn.

## 5. Mapping UI Đề Xuất

- `displayName` -> tên hiển thị chính
- `name` -> tên ngắn nội bộ của booth
- `business` -> tên đơn vị tổ chức, với workshop thường trùng tên đầy đủ
- `department` -> label UI là `Khoa`
- `checkInTime` -> label UI là `Thời gian điểm danh`

## 6. Tóm Tắt Nhanh

### Cho tài khoản hội thảo

1. Gọi `GET /api/business-admin/workshop-attendance`
2. Render tên hội thảo bằng `workshop.displayName`
3. Render bảng điểm danh
4. Gắn nút `Thêm bằng tay`
5. Gắn action `Xoá` cho từng dòng
6. Export:
   - CSV: `/api/business-admin/workshop-attendance/export`
   - Excel: `/api/business-admin/workshop-attendance/export/excel`
7. Thêm thủ công:
   - `POST /api/business-admin/workshop-attendance/manual`
8. Xoá khỏi danh sách:
   - `DELETE /api/business-admin/workshop-attendance/:studentCode`

### Cho school admin

1. Gọi `GET /api/school-admin/dashboard`
2. Tạo tab `Hội thảo`
3. Lọc theo `type === 'workshop'`
4. Hiển thị tên bằng `displayName`
