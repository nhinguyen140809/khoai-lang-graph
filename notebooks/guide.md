# Guide chạy Demo Thesis Notebook

Thứ tự start: **Backend → (tuỳ chọn Frontend) → Jupyter Notebook**.
Notebook chỉ **bắt buộc cần backend** — frontend chỉ để xem cùng dữ liệu trên UI.

> **Chú ý đường dẫn:** các lệnh `cd khoai-lang-graph/backend` bên dưới giả định
> bạn đứng ở thư mục **cha** (ĐACN). Nếu đang đứng **trong** `khoai-lang-graph`
> rồi thì chỉ cần `cd backend` — cd thêm `khoai-lang-graph/…` sẽ báo
> `no such file or directory`.

---

## 0. Yêu cầu môi trường

| Thứ | Yêu cầu | Kiểm tra |
|---|---|---|
| Python | 3.12+ qua `uv` (backend có sẵn `.venv`) | `cd backend && uv sync` |
| `.env` | `backend/.env` chứa `OPENAI_BASE_URL` + `OPENAI_API_KEY` (gateway BioTuring) | `grep -c OPENAI backend/.env` → ≥ 2 |
| Node (chỉ nếu chạy frontend) | ≥ 22 (Node 20 mặc định Mac **làm hỏng repo**) | `node -v` |
| Jupyter | kernel **"Khoai Backend (Python 3.12)"** đã đăng ký trong venv backend | `cd backend && uv run jupyter kernelspec list` |

Lưu ý: `.env` **không bao giờ được commit** — mỗi người tự có key của mình.

> **macOS:** đường dẫn có `Đ` (ĐACN) thỉnh thoảng làm lỗi `cd`/`tsc`/`pnpm`.
> Nếu gặp lỗi lạ, tạo symlink rồi thao tác qua đó:
> ```bash
> ln -sfn "$PWD" /tmp/khoai-repo
> ln -sfn "$PWD/backend" /tmp/khoai-backend
> ```

---

## 1. Start Backend (BẮT BUỘC — port 8001)

```bash
cd khoai-lang-graph/backend
uv run uvicorn khoailanggraph.main:app --port 8001
```

Thấy dòng này là xong:

```
INFO:     Uvicorn running on http://127.0.0.1:8001 (Press CTRL+C to quit)
khoailanggraph backend started  app_env=local  database=.../backend/data/dev.db
```

Kiểm tra nhanh (terminal khác):

```bash
curl -s http://localhost:8001/docs -o /dev/null -w "%{http_code}\n"   # → 200
```

> Không còn `DEMO_MODE` — backend chạy **LLM thật + search thật**. Run thật mất **15–45 phút**.

**(Tuỳ chọn) Seed dữ liệu cho frontend** (user `linh.pham@example.com` / `secret`
+ 4 project mẫu, chạy khi DB trống):

```bash
cd khoai-lang-graph/backend
uv run python scripts/seed_demo.py            # thêm --reset để làm sạch
```

---

## 2. Start Frontend (TUỲ CHỌN — port 3000)

Chỉ cần khi muốn xem pipeline trên UI trong lúc notebook chạy.

**Bước 0 — Node ≥ 22.13 (pnpm 11 yêu cầu):** máy Mac mặc định nvm đặt Node 20
lên trước → pnpm crash `ERR_UNKNOWN_BUILTIN_MODULE: node:sqlite`. Fix bằng
brew Node 25 (đã cài sẵn trên máy):

```bash
export PATH="/opt/homebrew/opt/node@25/bin:$PATH"
node -v        # phải ra v25.x
```

**Bước 1 — chạy frontend:**

```bash
cd backend/../frontend            # đang ở gốc repo thì chỉ cần: cd frontend
API_PROXY_TARGET=http://localhost:8001 npx pnpm@11.5.2 dev
```

- Đăng nhập: `linh.pham@example.com` / `secret` (cần đã chạy seed ở bước 1).
- Frontend proxy `/api` sang `:8001` — không cần cấu hình gì thêm.

---

## 3. Mở Notebook

```bash
cd khoai-lang-graph/backend
uv run jupyter lab ../notebooks/demo_thesis.ipynb
```

- **Kernel:** chọn **"Khoai Backend (Python 3.12)"** (Kernel → Change Kernel nếu
  đang mở bằng kernel khác).
- Notebook tự đăng ký tài khoản + đăng nhập, không cần chuẩn bị gì thêm.

---

## 4. Chạy từng cell — thứ tự và thời gian

Chạy **lần lượt từ trên xuống** (các cell sau phụ thuộc biến của cell trước):

| Cell | Làm gì | Thời gian |
|---|---|---|
| 1–2 | Kết nối, đăng nhập, nạp bộ helper format | ~1 giây |
| 3 | Tạo project + upload `.md` | ~1 giây |
| **4** | **Gửi ý tưởng → chạy run thật** (LLM gateway + search thật) | **15–45 phút** ⏳ |
| 5–16 | Đọc steps, artifacts, SRC/OBS/PER, phỏng vấn, đặc tả, backlog, trace links, **5 Honesty Gates**, tổng kết | vài giây/cell |

Mỗi cell in **2 lớp**: raw JSON nguyên vẹn (đúng shape FE nhận) + bảng/thẻ
format bằng `table()` / `box()` / `fmt_*` cho dễ đọc.

**Run lỗi thì sao?** Nếu Cell 4 trả run `failed` (thường là gateway 504 do
call vượt ~90 giây khi gateway bận):

1. Không cần start lại gì — **chạy lại đúng Cell 4** (tạo run mới).
2. Các cell sau vẫn đọc được dữ liệu các giai đoạn đã xong (SRC, OBS…).
3. Gateway vắng (buổi sáng) thì成功率 cao hơn.

---

## 5. Lỗi thường gặp

| Triệu chứng | Nguyên nhân / cách xử lý |
|---|---|
| `Cell 1` assert "Chưa có cookie session" | Backend chưa chạy ở `:8001` — làm lại bước 1 |
| Cell 4 chờ rất lâu rồi trả `failed` + `504 Gateway Time-out` | Gateway BioTuring bận — chạy lại Cell 4, hoặc thử lúc vắng |
| `Register: 409` | Không xảy ra (email tự unique theo thời gian); nếu thấy thì chạy lại Cell 1 |
| Upload trả `422` | File > 10MB hoặc không phải `.md/.txt/.html/.json` |
| `database is locked` khi gọi API trong lúc run đang chạy | Bình thường — executor giữ lock SQLite khi chạy; đợi run xong (notebook đã tự xếp thứ tự nên thường không gặp) |
| Kết quả search toàn Wikipedia | DuckDuckGo rate-limit IP này → backend tự fallback Wikipedia (keyless, thật) — đúng thiết kế |
| `pnpm`/`tsc` lỗi lạ trên macOS | Đường dẫn có `Đ` — dùng symlink `/tmp/khoai-repo` như bước 0 |

---

## Tóm tắt 1 dòng mỗi lệnh

```bash
# Terminal 1 — backend
cd khoai-lang-graph/backend && uv run uvicorn khoailanggraph.main:app --port 8001

# Terminal 2 — notebook
cd khoai-lang-graph/backend && uv run jupyter lab ../notebooks/demo_thesis.ipynb

# Terminal 3 — frontend (tuỳ chọn)
export PATH="/opt/homebrew/opt/node@25/bin:$PATH"
cd khoai-lang-graph/frontend && API_PROXY_TARGET=http://localhost:8001 npx pnpm@11.5.2 dev
```
