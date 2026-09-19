# ancientBOOK — Backend Architecture & Development Guide

Hệ thống Backend cho dự án **ancientBOOK**, xây dựng trên nền tảng **ASP.NET Core** áp dụng kiến trúc phân tầng chuẩn **Clean Architecture / Layered Architecture**.

---

## 1. Kiến trúc tổng quan (Layered Architecture)

Hệ thống tuân thủ nguyên tắc phụ thuộc một chiều (**Dependency Rule**). Các tầng bên ngoài phụ thuộc vào tầng bên trong, tầng lõi `Domain` độc lập tuyệt đối:

```text
                  ┌──────────────────────┐
                  │   AncientBook.API    │ (Entry Point, Controllers, Swagger)
                  └──────────┬───────────┘
                             │ References
              ┌──────────────┴──────────────┐
              ▼                             ▼
   ┌──────────────────────┐      ┌─────────────────────────┐
   │AncientBook.Applicat'n│◄─────│AncientBook.Infrastruct'e│
   └──────────┬───────────┘      └──────────┬──────────────┘
              │                             │
              └──────────────┬──────────────┘
                             ▼
                  ┌──────────────────────┐
                  │  AncientBook.Domain  │ (Core Entities - Độc lập tuyệt đối)
                  └──────────────────────┘
```

## 2. Trách nhiệm chi tiết của từng tầng

### 🔹 1. AncientBook.Domain

**Trách nhiệm:** Trái tim của hệ thống, chứa dữ liệu thực thể và các định nghĩa cốt lõi. Không phụ thuộc bất kỳ thư viện hay tầng nào khác.

**Cấu trúc thư mục:**

- `Entities/`: Các Model ánh xạ cơ sở dữ liệu (User, Book, Order, Inventory, AuditLog, SystemSetting...).
- `Enums/`: Các kiểu liệt kê trạng thái (OrderStatus, BookStatus, MemberRank...).
- `Common/`: Base Entity dùng chung (BaseEntity, IAuditableEntity...).

### 🔹 2. AncientBook.Application

**Trách nhiệm:** Chứa toàn bộ Business Logic, điều phối các Use Case nghiệp vụ.

**Phụ thuộc:** Chỉ tham chiếu `AncientBook.Domain`.

**Cấu trúc thư mục:**

- `Interfaces/`: Định nghĩa các giao diện trừu tượng (IApplicationDbContext, IAuditLogService, IAuthService...).
- `DTOs/`: Data Transfer Objects truyền nhận dữ liệu qua API (Request / Response).
- `Services/`: Hiện thực xử lý logic nghiệp vụ trung gian.
- `Common/`: Bộ lọc chung, xử lý phân trang, định dạng kết quả chuẩn.

### 🔹 3. AncientBook.Infrastructure

**Trách nhiệm:** Hiện thực kỹ thuật và kết nối tài nguyên bên ngoài (Database, Identity, Token, File storage).

**Phụ thuộc:** Tham chiếu `AncientBook.Domain` và `AncientBook.Application`.

**Cấu trúc thư mục:**

- `Persistence/`: ApplicationDbContext (tích hợp ChangeTracker tự động ghi vết Audit Log khi gọi SaveChangesAsync).
- `Identity/`: Cấu hình ASP.NET Core Identity, sinh và xác thực JWT Token.
- `Repositories/`: Triển khai các truy vấn cơ sở dữ liệu đặc thù.
- `Migrations/`: Lưu trữ các bản migration của Entity Framework Core.

### 🔹 4. AncientBook.API

**Trách nhiệm:** Cung cấp RESTful API, tiếp nhận yêu cầu từ Storefront / Admin Portal, định tuyến và phân quyền.

**Phụ thuộc:** Tham chiếu `AncientBook.Application` và `AncientBook.Infrastructure`.

**Cấu trúc thư mục:**

- `Controllers/`: Tiếp nhận HTTP Request (AuthController, AuditLogController, OrderController...).
- `Middlewares/`: Bắt lỗi tập trung (ExceptionMiddleware), kiểm soát request.
- `appsettings.json`: Cấu hình chuỗi kết nối CSDL (LocalDB / SQL Server) và thông số JWT.

## 3. Quy ước phát triển cho thành viên nhóm

**Nguyên tắc phụ thuộc:**

- Tuyệt đối không để Domain hoặc Application gọi ngược ra Infrastructure hay API.
- Mọi Controller ở tầng API không được viết câu lệnh LINQ/DbContext trực tiếp, bắt buộc phải gọi qua Service ở Application.

**Cơ chế Audit Log:**

- Mọi Entity muốn được tự động theo dõi biến động (Old/New values) bắt buộc phải kế thừa `IAuditableEntity`.
- Hệ thống sẽ tự động bắt thay đổi và ghi nhật ký kiểm toán trong `SaveChangesAsync()`.

**Mật khẩu & Bảo mật:**

- Tuyệt đối không lưu mật khẩu thô hoặc mật khẩu hash vào OldValue / NewValue của bảng AuditLogs.

## 4. Hướng dẫn cài đặt & Chạy dự án Local

### Yêu cầu môi trường:

- .NET SDK installed (`dotnet --version`)
- SQL Server (LocalDB hoặc SQL Server Express)
- Visual Studio 2022 / VS Code

### Các bước khởi chạy:

1. Clone repository và chuyển sang nhánh làm việc:

```bash
git checkout project
```

2. Di chuyển vào thư mục backend:

```bash
cd backend
```

3. Khôi phục packages và build toàn bộ Solution:

```bash
dotnet restore
dotnet build
```

4. Khởi chạy dự án API:

```bash
cd AncientBook.API
dotnet run
```

5. Truy cập Swagger giao diện tài liệu API:

```
https://localhost:{port}/swagger
```




# ancientBOOK — Frontend Architecture & Guidelines

Giao diện Single Page Application (SPA) cho hệ thống **ancientBOOK**, xây dựng trên nền tảng **React + Vite + TypeScript** và giải pháp tạo kiểu scoped bằng **CSS Modules**.

---

## 1. Cấu trúc thư mục (`src/`)

Dự án áp dụng mô hình phân tách trách nhiệm cao (Separation of Concerns):

```text
src/
├── assets/                  # Tài nguyên tĩnh (ảnh, icon svg)
├── types/                   # Định nghĩa Interface / Type (khớp DTO backend)
│   └── auditLog.ts          # Kiểu dữ liệu cho Audit Log, User, FilterParams
├── services/                # Tầng giao tiếp mạng (HTTP Client)
│   └── auditLogService.ts   # Gọi API xuống Backend ASP.NET Core
├── hooks/                   # Tầng CONTROLLER (Quản lý State & Nghiệp vụ)
│   └── useAuditLogController.ts # Logic tìm kiếm, lọc, phân trang
├── components/              # Tầng VIEW (Giao diện hiển thị)
│   ├── common/              # UI Component dùng chung (Button, Input, Table)
│   ├── layout/              # Khung sườn tổng thể (Sidebar, Topbar)
│   └── features/            # Component gắn liền với nghiệp vụ
│       └── audit-log/
│           ├── AuditTable.tsx
│           └── AuditTable.module.css
├── pages/                   # Giao diện tổng thể của từng màn hình/trang hoàn chỉnh
│   ├── HomePage.tsx         
│   └── BookDetailPage.tsx           
├── App.tsx                  # Root View kết nối Controller Hook & Component
├── App.module.css           # Bố cục trang chính
├── index.css                # Biến CSS toàn cục (:root) & Reset CSS
└── main.tsx                 # Entry point khởi chạy React DOM
```

## 2. Kiến trúc & Tư duy thiết kế

### 🔹 Mô hình Hook Controller (Tách biệt Controller & View)

Frontend không nhồi nhét logic vào JSX/TSX:

- **Controller** (`src/hooks/`): Xử lý toàn bộ logic nghiệp vụ (quản lý state, debouncing tìm kiếm, tính toán trang, gọi service). Ví dụ: `useAuditLogController`.
- **View** (`src/components/` & `App.tsx`): Thuần hiển thị dữ liệu nhận từ hook và kích hoạt sự kiện (onClick, onChange).

### 🔹 Cơ chế định kiểu: CSS Modules

- **Tránh đè class:** Mỗi component có một file `.module.css` đi kèm (Colocation). Tên class sẽ tự động được hash khi biên dịch, loại bỏ rủi ro xung đột class CSS toàn cục.
- **Quy chuẩn màu sắc (Design Tokens):** Tất cả màu sắc nhận diện (`--egyptian`, `--alice`, `--catalina`, `--saffron`, `--hairline`) được định nghĩa tập trung tại `:root` trong `src/index.css`. Các file `.module.css` chỉ dùng thông qua `var(--token-name)`.

### 🔹 Tính năng hiện tại: Audit Log Tracker

- **Hiển thị đối chiếu 2 cột:** Theo dõi biến động dữ liệu trực quan giữa giá trị trước khi sửa (OldValue) và sau khi sửa (NewValue).
- **Bảo mật:** Tự động che dữ liệu nhạy cảm dạng `***` (Bảo mật) đối với các hành động đổi mật khẩu.
- **Lọc tức thời:** Hỗ trợ tìm kiếm theo từ khóa (email, mã bản ghi, hành động), lọc theo vai trò (Admin, Staff, Shipper, Customer) và nhóm nghiệp vụ.

## 3. Hướng dẫn cài đặt & Chạy Local

### Yêu cầu:

- Node.js version 18 trở lên (`node -v`)
- Trình quản lý gói npm (`npm -v`)

### Các bước khởi chạy:

1. Di chuyển vào thư mục frontend:

```bash
cd frontend
```

2. Cài đặt các gói phụ thuộc:

```bash
npm install
```

3. Khởi chạy môi trường phát triển (Dev Server):

```bash
npm run dev
```

4. Truy cập giao diện tại: http://localhost:5173

## 4. Quy ước cho thành viên phát triển

- **Không viết CSS Inline hoặc Global Class bừa bãi:** Mọi component mới phải tạo kèm file `[TênComponent].module.css`.
- **Không gọi API trực tiếp trong UI Component:** Mọi hàm fetch dữ liệu phải đặt trong `services/`, sau đó đưa vào Custom Hook ở `hooks/` để điều khiển state.
- **Đồng bộ Type:** Bất kỳ thay đổi nào từ DTO của Backend ASP.NET Core phải được cập nhật tương ứng vào `src/types/`.
