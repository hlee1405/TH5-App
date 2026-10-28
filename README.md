# Ứng Dụng Chat Di Động 1-1 Realtime Với Firebase - ConnectChat

Ứng dụng chat di động thời gian thực phát triển bằng **React Native CLI** (không dùng Expo), **TypeScript** và **Firebase JS SDK** (Firebase Authentication, Realtime Database) kết hợp cùng `@react-native-community/geolocation`.

---

## 🚀 Các Tính Năng Đã Thực Hiện (Bài Thực Hành 5)

### 1. Đăng ký / Đăng nhập Firebase
- **Màn hình Đăng ký (`RegisterScreen`)**: Gồm các trường Họ tên, Email, Mật khẩu (tối thiểu 6 ký tự) và Nhập lại mật khẩu. Tự động kiểm tra tính hợp lệ dữ liệu, hiển thị banner lỗi tiếng Việt, tự động lưu thông tin hồ sơ vào Realtime Database tại `/users/{uid}`.
- **Màn hình Đăng nhập (`LoginScreen`)**: Đăng nhập bằng Email & Mật khẩu với Firebase Auth. Tự động chuyển đổi các mã lỗi Firebase (`auth/invalid-credential`, `auth/user-not-found`, `auth/wrong-password`...) thành thông báo lỗi rõ ràng. Cung cấp nút chọn nhanh tài khoản kiểm thử giữa 2 người dùng (`user1@example.com` và `user2@example.com`).
- **Đăng xuất (`SettingsScreen`)**: Nút Đăng xuất ở màn hình Cài đặt có hộp thoại xác nhận `Alert`, tự động chuyển trạng thái `isOnline` sang `false`, gọi `signOut(auth)` và điều hướng quay về màn hình Đăng nhập.

### 2. Danh bạ Người dùng (Contacts)
- Lấy danh sách tất cả người dùng đã đăng ký từ node `/users` trên Firebase Realtime Database (loại trừ chính bản thân).
- Hiển thị trạng thái **Trực tuyến (Online)** / **Ngoại tuyến (Offline)** cập nhật theo thời gian thực (tích hợp hệ thống Firebase Presence `.info/connected` và `onDisconnect`).
- Có ô tìm kiếm người dùng theo tên hoặc email và các tab lọc ("Tất cả", "Trực tuyến").
- Nhấn vào người dùng để mở ngay màn hình Chat 1-1.

### 3. Chat 1-1 Thời Gian Thực (Realtime Chat)
- Tin nhắn gửi và nhận tức thì mà không cần tải lại màn hình bằng listener `onValue` của Firebase Realtime Database.
- Phân biệt trực quan tin nhắn:
  - **Tin của mình**: Nằm bên phải, nền màu chủ đạo (xanh dương), chữ trắng, thời gian gửi màu sáng.
  - **Tin của đối phương**: Nằm bên trái kèm avatar đại diện, nền card, chữ tối, thời gian xám.
- Chặn gửi tin nhắn rỗng (`disabled` khi không có ký tự).
- Tự động cuộn xuống tin nhắn mới nhất khi mở hoặc nhận tin nhắn mới.
- Thanh tiêu đề hiển thị tên, ảnh đại diện và trạng thái online/offline trực tiếp của người đang chat.

### 4. Gửi Vị Trí Hiện Tại (Location Sharing)
- Nút 📍 nằm ngay thanh nhập tin nhắn.
- Tự động yêu cầu quyền vị trí (`ACCESS_FINE_LOCATION`) qua `PermissionsAndroid`. Nếu người dùng từ chối, hiển thị thông báo `Alert` rõ ràng.
- Lấy tọa độ GPS chính xác qua `@react-native-community/geolocation`.
- **Tin nhắn vị trí hiển thị khác tin thường**: Hiển thị card vị trí với biểu tượng ghim 📍, thông số tọa độ và nút hành động *"Nhấn để mở trên Google Maps ↗"*.
- Khi nhấn vào tin nhắn vị trí, tự động mở ứng dụng Google Maps hoặc trình duyệt đúng tọa độ đã gửi.

### 5. Màn hình Home (Danh Sách Cuộc Trò Chuyện)
- Hiển thị danh sách các cuộc trò chuyện của người dùng lấy từ `/userChats/{uid}`: avatar, tên đối phương, tin nhắn cuối cùng và thời gian.
- Cuộc trò chuyện mới nhất luôn được sắp xếp nằm trên cùng (`timestamp` giảm dần).
- Huy hiệu (Badge) số tin nhắn chưa đọc:
  - Tự động tăng lên khi có tin nhắn mới gửi đến.
  - Tự động reset về 0 ngay khi mở cuộc trò chuyện đó.
  - Đồng bộ số tin chưa đọc lên icon tab bar dưới đáy màn hình.

### 6. Kiến Trúc Kỹ Thuật
- Toàn bộ code xử lý Firebase được gom vào thư mục **`src/services/`**:
  - `src/services/firebaseConfig.ts`: File cấu hình thông số kết nối Firebase.
  - `src/services/firebase.ts`: Khởi tạo Firebase App, Auth và Realtime Database.
  - `src/services/authService.ts`: Đăng ký, Đăng nhập, Đăng xuất, quản lý trạng thái Auth và thông báo lỗi.
  - `src/services/userService.ts`: Đồng bộ danh sách người dùng và hệ thống Presence online/offline.
  - `src/services/chatService.ts`: Quản lý tin nhắn 1-1, cuộc trò chuyện, unread count và định dạng tin nhắn vị trí.
  - `src/services/locationService.ts`: Xử lý quyền vị trí và mở Google Maps.
- **Hủy lắng nghe trong cleanup của `useEffect`**: Mọi listener Firebase (`onValue`) đều trả về hàm unsubscribe và được gọi trong cleanup function của `useEffect` để tránh rò rỉ bộ nhớ và hiện lặp tin nhắn.
- **Màn hình Thông báo**: Được giữ nguyên đầy đủ tính năng.

---

## 📁 Cấu Trúc Thư Mục

```
th22/
├── android/
│   └── app/src/main/AndroidManifest.xml    # Đã cấu hình quyền INTERNET, ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION
├── database.rules.json                     # Luật bảo mật Firebase Realtime Database
├── src/
│   ├── components/                         # Avatar, Icons (kèm LocationPinIcon), SearchBar
│   ├── context/
│   │   └── AppContext.tsx                  # Quản lý state đăng nhập, đồng bộ Firebase, theme, unread counts
│   ├── navigation/
│   │   └── RootNavigator.tsx               # Stack Navigator (Login, Register, ChatDetail) & Tab Navigator
│   ├── screens/
│   │   ├── LoginScreen.tsx                 # Màn hình Đăng nhập Firebase
│   │   ├── RegisterScreen.tsx              # Màn hình Đăng ký Firebase
│   │   ├── HomeScreen.tsx                  # Danh sách cuộc trò chuyện realtime
│   │   ├── ContactsScreen.tsx              # Danh bạ realtime online/offline
│   │   ├── ChatDetailScreen.tsx            # Chat 1-1 realtime & gửi vị trí Google Maps
│   │   ├── NotificationsScreen.tsx         # Màn hình Thông báo
│   │   └── SettingsScreen.tsx              # Cài đặt cá nhân & Đăng xuất
│   ├── services/                           # Toàn bộ logic Firebase & Geolocation
│   │   ├── firebaseConfig.ts
│   │   ├── firebase.ts
│   │   ├── authService.ts
│   │   ├── userService.ts
│   │   ├── chatService.ts
│   │   ├── locationService.ts
│   │   └── index.ts
│   ├── theme/                              # Light & Dark theme
│   └── types/                              # TypeScript interfaces (Message, Chat, Contact, User)
├── App.tsx
└── package.json
```

---

## ⚙️ Hướng Dẫn Cấu Hình Firebase

### Bước 1: Tạo Firebase Project
1. Truy cập [Firebase Console](https://console.firebase.google.com/) và tạo project mới.
2. Vào mục **Build** -> **Authentication** -> Tab **Sign-in method** -> Bật provider **Email/Password**.
3. Vào mục **Build** -> **Realtime Database** -> Nhấn **Create Database** (chọn location `Singapore` hoặc `United States`).

### Bước 2: Thiết lập Security Rules cho Realtime Database
Tại tab **Rules** của Realtime Database, dán nội dung từ file `database.rules.json`:
```json
{
  "rules": {
    "users": {
      ".read": "auth != null",
      "$uid": {
        ".write": "auth != null && auth.uid === $uid"
      }
    },
    "messages": {
      ".read": "auth != null",
      "$chatId": {
        ".write": "auth != null"
      }
    },
    "userChats": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        ".write": "auth != null"
      }
    }
  }
}
```
Nhấn **Publish** để áp dụng.

### Bước 3: Cập nhật cấu hình vào ứng dụng
1. Tại Firebase Console -> **Project Settings** (biểu tượng bánh răng) -> Tab **General** -> Mục **Your apps** -> Chọn icon Web `</>` để tạo Web app.
2. Sao chép đối tượng `firebaseConfig` và dán vào file `src/services/firebaseConfig.ts`:
```ts
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

---

## 📱 Hướng Dẫn Khởi Chạy Ứng Dụng

### 1. Khởi động Metro Bundler:
```sh
npm start
```

### 2. Chạy trên Android (máy ảo hoặc thiết bị thật):
```sh
npm run android
```

### 3. Kiểm thử 2 người dùng chat với nhau:
- **Người dùng 1**: Đăng ký tài khoản `user1@example.com`, mật khẩu `123456`, tên `Nguyễn Văn A`.
- **Người dùng 2** (trên tab/thiết bị khác hoặc đăng xuất và đăng ký): Đăng ký `user2@example.com`, mật khẩu `123456`, tên `Trần Thị B`.
- Mở mục **Danh bạ**, bạn sẽ thấy người dùng kia với chấm xanh **Trực tuyến**.
- Nhấn vào người dùng để mở khung Chat 1-1:
  - Nhập tin nhắn văn bản và nhấn Gửi ➔ Tin nhắn hiển thị tức thì.
  - Nhấn nút 📍 để gửi vị trí hiện tại ➔ Nhấn vào tin nhắn vị trí để mở Google Maps.
  - Trở về màn hình **Tin nhắn (Home)**: Tin nhắn mới nhất hiển thị trên đầu và số tin chưa đọc cập nhật tự động.
