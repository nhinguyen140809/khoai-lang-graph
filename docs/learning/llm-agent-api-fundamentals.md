# Tìm hiểu cơ chế hoạt động của LLM Agent API

**Loại tài liệu:** ghi chú học tập, gồm các khái niệm cốt lõi và cách các hệ thống thực tế implement những khái niệm đó. Tài liệu này **không** phải tài liệu design; nội dung chỉ trình bày kiến thức chung và không gắn với một hệ thống cụ thể.

- **Chủ đề:** LLM API stateless, agent loop, streaming, cách tính token, prompt caching, quản lý context, subagent, và cách Claude Code xây dựng một sản phẩm agent có tính tương tác cao trên nền các cơ chế này.
- **Mục đích:** hiểu các cơ chế cần thiết để xây dựng một hệ multi-agent, trong đó user cung cấp requirement, các agent xử lý và trả về artifact để review. Hệ thống dạng này cần đạt được trải nghiệm tương tác tương tự Claude Code (trạng thái được cập nhật liên tục, hiển thị từng bước và thought, câu hỏi kèm lựa chọn) mà không tiêu tốn token và băng thông một cách không cần thiết.
- **Phương pháp:** hỏi đáp, kết hợp với việc quan sát Claude Code trên máy local (file transcript của session và stream output).
- **Ngày:** 2026-09-30

## Mục lục

- [0. Các câu hỏi ban đầu](#0-các-câu-hỏi-ban-đầu)
- [Phần I - Khái niệm cốt lõi](#phần-i---khái-niệm-cốt-lõi)
  - [1. Tính stateless của LLM API](#1-tính-stateless-của-llm-api)
  - [2. Agent loop](#2-agent-loop)
  - [3. Streaming bằng SSE](#3-streaming-bằng-sse)
  - [4. Tool call là cơ chế tạo ra các dạng response](#4-tool-call-là-cơ-chế-tạo-ra-các-dạng-response)
- [Phần II - Chi phí và hiệu năng](#phần-ii---chi-phí-và-hiệu-năng)
  - [5. Cách tính token](#5-cách-tính-token)
  - [6. Prompt caching](#6-prompt-caching)
  - [7. Quản lý context](#7-quản-lý-context)
  - [8. Xử lý tài liệu](#8-xử-lý-tài-liệu)
  - [9. Subagent](#9-subagent)
- [Phần III - Case study: Claude Code](#phần-iii---case-study-claude-code)
  - [10. Kiến trúc của CLI](#10-kiến-trúc-của-cli)
  - [11. Resume session sau một thời gian gián đoạn](#11-resume-session-sau-một-thời-gian-gián-đoạn)
  - [12. Việc duy trì connection giữa các thành phần](#12-việc-duy-trì-connection-giữa-các-thành-phần)
- [Phần IV - Backend gọi LLM API bên ngoài](#phần-iv---backend-gọi-llm-api-bên-ngoài)
  - [13. Khác biệt API giữa các provider](#13-khác-biệt-api-giữa-các-provider)
  - [14. Lớp chuẩn hóa giữa các provider](#14-lớp-chuẩn-hóa-giữa-các-provider)
  - [15. Số liệu do server tính và số liệu do client tính](#15-số-liệu-do-server-tính-và-số-liệu-do-client-tính)
  - [16. Chiến lược caching khi backend gọi LLM bên ngoài](#16-chiến-lược-caching-khi-backend-gọi-llm-bên-ngoài)
- [Phần V - Chuyển từ CLI local sang hệ thống web nhiều người dùng](#phần-v---chuyển-từ-cli-local-sang-hệ-thống-web-nhiều-người-dùng)
  - [17. So sánh CLI local và server tập trung](#17-so-sánh-cli-local-và-server-tập-trung)
  - [18. Phân tách API server và worker](#18-phân-tách-api-server-và-worker)
  - [19. Truyền stream xuống trình duyệt](#19-truyền-stream-xuống-trình-duyệt)
  - [20. Event log](#20-event-log)
- [Phần VI - Checklist](#phần-vi---checklist)
- [Thuật ngữ](#thuật-ngữ)
- [Các điểm cần kiểm chứng thêm](#các-điểm-cần-kiểm-chứng-thêm)
- [Bước tiếp theo](#bước-tiếp-theo)

---

## 0. Các câu hỏi ban đầu

1. Vì LLM API là stateless, mỗi bước của agent đều là một lần gọi API riêng. Cách hoạt động này có gây tốn kém về token và băng thông hay không?
2. Claude Code hiển thị trạng thái, command và thought ở từng bước bằng cơ chế nào?
3. Response lúc có dạng danh sách lựa chọn, lúc có dạng text thông thường. Model được train riêng cho từng format, hay toàn bộ đều là kết quả của prompting?
4. CLI sử dụng loại API nào: HTTP thông thường hay một giao thức riêng?
5. Context được lưu ở đâu, và khi resume session vào ngày hôm sau thì request chứa những gì?
6. Caching, compaction, tài liệu và subagent ảnh hưởng như thế nào đến chi phí?
7. API của các provider khác nhau ở những điểm nào, và các số liệu như số token, context length, usage do bên nào tính?
8. Khi backend chạy agent loop và gọi LLM của provider bên ngoài, caching cần được tổ chức như thế nào để giảm chi phí?
9. Khi sản phẩm là web app nhiều người dùng thay vì CLI local, kiến trúc cần thay đổi những gì?

Các phần tiếp theo trả lời những câu hỏi này theo trình tự: bản chất của API, chi phí, cách xây dựng một sản phẩm thực tế, cách backend làm việc với LLM API bên ngoài, và những thay đổi cần thiết khi chuyển sang hệ thống web.

---

## Phần I - Khái niệm cốt lõi

### 1. Tính stateless của LLM API

Mỗi lần gọi Messages API (`POST /v1/messages`) phải chứa **toàn bộ** thông tin mà model cần xử lý:

```text
request = tools (tên + JSON schema + description)
        + system prompt
        + messages (toàn bộ hội thoại tính đến thời điểm gọi)
```

- Model **không lưu trữ bất kỳ thông tin nào** giữa các lần gọi. Context của model chỉ bao gồm nội dung của request hiện tại.
- Việc lưu hội thoại và gửi lại hội thoại trong mỗi lần gọi do một thành phần nằm ngoài model đảm nhận, gọi là **client** hoặc **harness**.
- Do đó, mỗi bước của agent đều phải gửi lại toàn bộ history. Chi phí của cách làm này được giảm nhờ prompt caching (mục 6) và nhờ việc kiểm soát kích thước context (mục 7 đến 9), chứ không nhờ việc hạn chế gửi lại history.

### 2. Agent loop

Agent là một vòng lặp do client điều khiển, trong đó model stateless được gọi nhiều lần:

```text
client -> API : [tools, system, history]
API -> client : tool_use {name: "Bash", input: {command: "ls"}}   stop_reason = tool_use
client        : tự thực thi lệnh "ls" (trên máy user hoặc trong sandbox)
client -> API : [tools, system, history + tool_use + tool_result]
API -> client : tool_use tiếp theo, hoặc text kết thúc            stop_reason = end_turn
```

Các đặc điểm chính của agent loop:

- **Mỗi bước tương ứng với một lần gọi API.** Một task cần 20 tool call sẽ phát sinh khoảng 20 request.
- **Tool được thực thi ở phía client**, không thực thi trên server của model. Model chỉ quyết định tool nào được gọi và input của tool đó.
- Giá trị `stop_reason` xác định hành động tiếp theo của client: `tool_use` yêu cầu client thực thi tool rồi gọi lại API; `end_turn` cho biết agent đã hoàn thành hoặc đang chờ user.
- Trong một response, model có thể yêu cầu nhiều tool call cùng lúc (parallel tool use). Client có thể thực thi các tool này song song và gửi toàn bộ kết quả trong request kế tiếp.

### 3. Streaming bằng SSE

Khi request có tham số `stream: true`, API trả kết quả theo dạng **Server-Sent Events (SSE)**. SSE là một HTTP response thông thường, nhưng server không đóng response ngay mà tiếp tục ghi thêm các event vào đó.

```text
message_start
content_block_start   (type: thinking | text | tool_use)
content_block_delta   (thinking_delta | text_delta | input_json_delta)
content_block_stop
message_delta         (stop_reason, usage)
message_stop
```

- Việc text xuất hiện dần, thought được hiển thị trong lúc model xử lý, hay command được hiển thị trước khi chạy đều là kết quả của việc client **render các delta** nói trên.
- Spinner, status line và khung tool output thu gọn được đều thuộc **UI của client**. Model chỉ trả về các block có cấu trúc, không trả về giao diện.
- Giao thức truyền tải là **HTTPS** thông thường; CLI không sử dụng giao thức riêng.

Một SSE response có định dạng như sau:

```text
HTTP/1.1 200 OK
Content-Type: text/event-stream

id: 42
event: tool.called
data: {"name":"Bash","input":{"command":"ls"}}

: ping
```

- SSE chỉ truyền dữ liệu theo một chiều, từ server xuống client. Khi cần gửi dữ liệu lên server, client phải sử dụng các HTTP request riêng.
- Client là bên khởi tạo kết nối; server là bên duy trì kết nối và quyết định thời điểm đóng.
- Mỗi event có thể mang một `id`. Khi kết nối lại, client gửi kèm header `Last-Event-ID` để server gửi lại các event mà client chưa nhận được.

### 4. Tool call là cơ chế tạo ra các dạng response

Khi Claude Code hiển thị một câu hỏi nhiều lựa chọn, model đang **gọi một tool** (ví dụ `AskUserQuestion`) với input là một object JSON tuân theo schema của tool (câu hỏi, danh sách option, label, description). Client nhận diện tên tool và render giao diện chọn option; lựa chọn của user được gửi lại cho model dưới dạng `tool_result`. Các thao tác như tạo task, spawn subagent hay publish artifact cũng được thực hiện thông qua tool.

Cơ chế này dựa trên cả training lẫn prompting, nhưng mỗi yếu tố đảm nhận một phần khác nhau:

| Thành phần | Nội dung | Thời điểm thay đổi |
|---|---|---|
| **Training** (năng lực chung) | Model được train để sử dụng tool: đọc description, sinh JSON hợp lệ theo schema, xác định thời điểm cần gọi tool | Khi có phiên bản model mới |
| **Harness** (tính năng cụ thể) | System prompt, danh sách tool cùng description, và code phía client để render từng tool | Khi client phát hành phiên bản mới |

Phần lớn tính năng UX mới được bổ sung bằng cách **thêm tool mới, điều chỉnh prompt hoặc description, và viết code render tương ứng**, mà không cần train lại model. Có thể tồn tại một phần training dành riêng cho hành vi agentic, nhưng thông tin chi tiết không được công bố, nên tài liệu này không dựa vào giả định đó.

**Hệ quả đối với thiết kế:** mỗi dạng response mà hệ thống cần nhận từ agent nên được định nghĩa thành một tool có schema chặt chẽ, thay vì parse text tự do.

---

## Phần II - Chi phí và hiệu năng

### 5. Cách tính token

Chi phí được tính trên **toàn bộ độ dài của request**, nhưng mỗi phần của request có unit price khác nhau:

```text
chi phí của một request =
    token đọc từ cache            x ~0.1  x giá input
  + token ghi vào cache           x 1.25  x giá input   (TTL 5 phút; TTL 1 giờ là 2x)
  + token không được cache        x 1     x giá input
  + token output (gồm thinking)   x giá output          (giá output cao hơn nhiều so với giá input)
```

Object `usage` trong response ghi nhận riêng từng loại token: `cache_read_input_tokens`, `cache_creation_input_tokens`, `input_tokens`, `output_tokens`. Ngoài ra, endpoint `count_tokens` cho phép đo số token của một request trước khi gửi.

Trong tài liệu này, context của một request là **toàn bộ input** gửi cho model: tools, system prompt và toàn bộ messages. Output mà model sinh ra ở một bước không thuộc context của bước đó, nhưng được nối vào history và trở thành một phần context của bước sau.

Ví dụ, tại bước thứ 20 của một session, toàn bộ input của request có độ dài 80k token. Trong đó, 78k token là phần prefix đã được cache từ bước 19, còn 2k token là phần mới (output của bước 19 và tool result vừa nhận):

- 78k token được đọc từ cache, tương đương khoảng 7.8k token tính theo giá input.
- 2k token mới được ghi vào cache, tương đương khoảng 2.5k token.
- Phần output được tính thêm theo giá output.
- Chi phí input của bước này tương đương khoảng 10k token thay vì 80k token.

Ngay cả khi có caching, độ dài context vẫn ảnh hưởng đến hệ thống vì ba lý do:

1. Token đọc từ cache **có giá thấp nhưng vẫn bị tính phí**. Với context 100k token, **mỗi bước** tốn khoảng 10k token quy đổi chỉ để đọc lại context. Vì mỗi bước đều đọc lại toàn bộ context, và context tăng thêm sau mỗi bước, tổng chi phí của một session tăng nhanh hơn mức tuyến tính theo số bước (gần với bậc hai). Giả sử mỗi bước thêm 2k token vào context, thì context ở bước thứ n dài khoảng 2k x n token, và chi phí đọc cache của bước đó khoảng 0.1 x 2k x n. Cộng dồn qua các bước:

   | Số bước | Context ở bước cuối | Tổng chi phí đọc cache (quy đổi) |
   |---|---|---|
   | 20 | ~40k | ~42k token |
   | 40 | ~80k | ~164k token |

   Số bước tăng gấp đôi nhưng tổng chi phí tăng khoảng gấp bốn lần. Đây là lý do các session dài cần compaction hoặc chiến lược context (mục 7).
2. Mọi token, dù được cache hay không, đều được tính vào giới hạn của **context window**.
3. Context dài và chứa nhiều nội dung không liên quan làm giảm **chất lượng** câu trả lời.

### 6. Prompt caching

**Đối tượng được cache.** Quá trình xử lý một request gồm hai giai đoạn: *prefill* (đọc toàn bộ input và tính các tensor key/value nội bộ, gọi là KV cache) và *decode* (sinh từng token output). Prompt caching lưu kết quả prefill của **phần đầu input**. Một request sau có phần đầu giống hệt sẽ không phải thực hiện lại bước tính này, nhờ đó chi phí thấp hơn và time-to-first-token ngắn hơn.

Cache chỉ lưu kết quả tính toán trung gian (các tensor), **không lưu text** theo dạng có thể truy xuất. Do đó, cache không đóng vai trò nơi lưu trữ hội thoại: provider không cung cấp API để lấy lại nội dung đã cache, và với cơ chế prefix caching (Anthropic, OpenAI), client không thể thay phần text bằng một mã tham chiếu tới cache. Mỗi request vẫn phải gửi đầy đủ text; server so khớp phần đầu của text với cache để quyết định có bỏ qua bước tính toán hay không. Ngoại lệ là API cache tường minh của Gemini (mục 16.1), cho phép request tham chiếu tới cache bằng tên thay vì gửi lại nội dung; tuy nhiên, các token trong cache vẫn được tính phí.

**Quy tắc prefix.** Server không so sánh từng field một cách độc lập, mà xử lý request như một chuỗi duy nhất theo thứ tự cố định:

```text
[tools] -> [system] -> [msg1] -> [msg2] -> ... -> [msgN]
                                    ^
                           cache_control breakpoint
```

Một request được tính là **cache hit** khi toàn bộ phần từ đầu chuỗi đến breakpoint **giống hệt từng byte** với một request trước đó, với điều kiện cùng model, cùng organization và cache chưa hết TTL. Mọi nội dung kể từ byte khác biệt đầu tiên đều phải được tính lại.

Thứ tự trên dẫn đến các hệ quả sau:

| Nội dung thay đổi | Phần cache bị mất |
|---|---|
| tools (thêm, bớt, đổi thứ tự, sửa description) | toàn bộ cache |
| system prompt | system và toàn bộ messages |
| một message cũ | message đó và mọi nội dung phía sau |
| không sửa nội dung cũ, chỉ **nối thêm** message mới vào cuối | không mất phần nào; toàn bộ prefix cũ đều hit |

**Vòng đời của cache.**

- Cache được lưu trên server của provider và được tra cứu theo nội dung. Cache **không gắn với HTTP connection**; một request gửi qua connection mới vẫn có thể hit cache.
- Cache **không bị xóa** khi có message mới. Request mới gồm prefix cũ (được đọc từ cache) và phần mới (được tính rồi ghi vào cache).
- TTL mặc định là **5 phút**, có thể chọn **1 giờ**. Mỗi lần hit, TTL được tính lại từ đầu. Nếu không có request nào sử dụng cache trong khoảng TTL, cache tự hết hạn.
- Cache được cách ly theo organization; khách hàng khác không thể sử dụng cache của organization này.

**Các trường hợp hit điển hình.**

| Tình huống | Lý do hit |
|---|---|
| Bước N+1 trong cùng một agent loop | request N+1 bằng request N cộng thêm các message mới ở cuối |
| Nhiều user dùng chung tools, system prompt và tài liệu tham khảo | các request có cùng prefix (trong phạm vi một organization) |
| Nhiều subagent cùng loại chạy song song | các subagent có cùng system prompt và tools |
| Nhiều câu hỏi về cùng một tài liệu dài | tài liệu được đặt trước, câu hỏi được đặt sau |

**Các nguyên nhân thường gây cache miss.**

- System prompt chứa timestamp, request ID hoặc tên user ở phần đầu.
- JSON được serialize không ổn định, khiến thứ tự key thay đổi giữa các lần gọi.
- History bị cắt theo kiểu sliding window: việc loại bỏ message cũ nhất làm thay đổi prefix, nên mọi bước đều miss.
- Khoảng thời gian giữa hai request vượt quá TTL.
- Prefix ngắn hơn độ dài tối thiểu được phép cache (tùy model, tối đa khoảng vài nghìn token).

**Cách đánh dấu cache với Claude.** Mỗi request được đặt tối đa 4 breakpoint `cache_control`, ví dụ: cuối phần tools, cuối system prompt, cuối tài liệu tham khảo và cuối message gần nhất.

**Sự khác biệt giữa các provider.** Mọi provider đều cache theo **prefix**, vì KV cache của một token trong transformer phụ thuộc vào toàn bộ các token đứng trước nó. Các provider khác nhau ở cách kích hoạt: Claude yêu cầu đánh dấu `cache_control` tường minh, một số provider tự động cache prefix, một số provider khác cung cấp API riêng để tạo cache. Cost và TTL cũng khác nhau giữa các provider. Cách kích hoạt caching ở từng provider được trình bày ở mục 16.1. Quy tắc prefix chỉ áp dụng cho **prompt caching của LLM**; HTTP cache, Redis hay CDN cache theo key hoặc URL và tuân theo quy tắc khác.

**Nguyên tắc tổng quát:** nội dung tĩnh đặt trước, nội dung động đặt sau, và chỉ nối thêm nội dung mới vào cuối.

### 7. Quản lý context

Context được **client hoặc backend tạo lại trong mỗi request**. Với Claude Code, context gồm các thành phần sau:

- **system** = template cố định + thông tin môi trường (OS, thư mục, git status, ngày) + `CLAUDE.md` + các file memory
- **tools** = tool built-in + tool từ các MCP server + các loại agent có thể gọi
- **messages** = mảng hội thoại trong bộ nhớ, đồng thời được ghi vào file transcript `.jsonl` trên máy

Theo mặc định, history được gửi **nguyên văn**. Việc tóm tắt (compact) chỉ diễn ra khi context gần đạt giới hạn.

Có nhiều chiến lược để xác định nội dung đưa vào context:

| Chiến lược | Cách thực hiện | Ưu điểm | Nhược điểm | Trường hợp phù hợp |
|---|---|---|---|---|
| **Full history** | Gửi toàn bộ history | Đơn giản nhất; tỉ lệ cache hit cao nhất; không mất thông tin | Kích thước tăng không giới hạn; chứa nhiều nội dung không liên quan; có thể vượt giới hạn window | Session ngắn hoặc trung bình |
| **Sliding window** | Chỉ giữ N message gần nhất | Kích thước được giới hạn | Mất cache ở mọi bước; mất các quyết định đưa ra ở đầu session | Hiếm khi phù hợp với agent |
| **Summary + recent (compaction)** | Khi context lớn, thay phần history cũ bằng bản tóm tắt | Kích thước được giới hạn; giữ lại các ý chính | Bản tóm tắt có thể bỏ sót chi tiết; mỗi lần compact phát sinh thêm chi phí | Session dài (cách Claude Code áp dụng) |
| **Structured state** | Context gồm requirement, artifact hiện tại, các quyết định đã chốt và feedback mới nhất | Ngắn gọn, chính xác, ổn định | Cần thiết kế và duy trì cấu trúc state | Luồng requirement -> artifact -> review |
| **Retrieval (RAG / tool)** | Chỉ đưa vào context những phần liên quan khi cần | Áp dụng được cho khối lượng tài liệu lớn | Có thể không lấy đủ thông tin cần thiết; phát sinh thêm lượt gọi | Tài liệu lớn hoặc số lượng tài liệu nhiều |

Các chiến lược trên có thể được kết hợp: structured state đóng vai trò thành phần chính của context, tool được dùng để truy xuất tài liệu, còn compaction là biện pháp dự phòng khi context vượt ngưỡng.

**Ảnh hưởng của compaction đến cache.**

```text
Trước:      [tools][system][msg1 ... msg200]                  (~150k, toàn bộ hit cache)

Compact:    [tools][system][msg1 ... msg200][yêu cầu tóm tắt]
            -> hầu hết là cache read (chi phí thấp) + chi phí output cho bản tóm tắt

Sau:        [tools][system][TÓM TẮT ~5k][các message gần nhất]
             ^^^^^^^^^^^^^^ vẫn hit      ^^^^^^^^^^^^^^^^^^^^^^^^^^^^ phần mới: ghi cache một lần (1.25x)
                                                                     các bước sau đọc với giá 0.1x
```

- Tools và system không thay đổi nên vẫn hit cache; cache chỉ bị mất từ vị trí của bản tóm tắt trở đi. Vì lý do này, bản tóm tắt cần được đặt **sau** system prompt thay vì được đưa vào system prompt.
- Cache cũ không bị xóa chủ động, mà tự hết hạn khi hết TTL.
- Về tổng chi phí, compaction phát sinh chi phí một lần (output của bản tóm tắt và khoảng 5k token ghi vào cache), nhưng sau đó mỗi bước chỉ phải đọc lại khoảng 10k token thay vì 150k token.

### 8. Xử lý tài liệu

| Cách thực hiện | Mô tả | Ưu điểm | Nhược điểm | Trường hợp phù hợp |
|---|---|---|---|---|
| **A. Nạp trực tiếp vào context** | Đặt tài liệu ngay sau system prompt và thêm cache breakpoint ở cuối tài liệu. PDF và ảnh được gửi dưới dạng content block `document`/`image`; tài liệu có thể được upload một lần qua Files API rồi tham chiếu bằng `file_id` | Model luôn có tài liệu trong context; từ bước thứ hai, chi phí thấp nhờ cache | Token của tài liệu bị tính phí (dưới dạng cache read) ở mọi bước; chiếm dung lượng window | Tài liệu nhỏ hoặc vừa mà agent cần sử dụng liên tục (spec, style guide, schema) |
| **B. Truy cập qua tool** | Context chỉ chứa danh mục tài liệu (id, tiêu đề, mô tả ngắn). Agent sử dụng các tool như `list_documents()`, `read_document(id, section hoặc offset, limit)`, `search_documents(query)` | Chỉ phần được đọc mới được đưa vào context; kết quả được nối vào cuối nên không làm mất cache | Agent có thể không đọc đúng phần cần thiết; phát sinh thêm bước | Tài liệu lớn hoặc số lượng tài liệu nhiều (Claude Code đọc codebase theo cách này, thông qua Read và Grep) |
| **C. Giao cho subagent đọc** | Giao một task như "đọc 5 tài liệu này và trích xuất các yêu cầu liên quan đến auth" | Context chính chỉ nhận khoảng 1 đến 2k token kết luận | Phát sinh chi phí cho subagent; bản tóm tắt có thể bỏ sót chi tiết | Khối lượng cần đọc lớn nhưng chỉ cần kết luận |
| **D. Pipeline retrieval (RAG)** | Chia tài liệu thành chunk, tạo embedding, tìm kiếm, sau đó đưa các chunk liên quan nhất vào context | Khả năng mở rộng cao nhất | Cần xây dựng hạ tầng; chất lượng phụ thuộc vào cách chia chunk | Knowledge base rất lớn |

Files API giúp tránh việc upload lại dữ liệu nhiều lần nhưng **không** giúp giảm số token. Tài liệu vẫn được tính vào context trong mỗi request (thông qua cache).

**Khi user thêm hoặc sửa tài liệu trong lúc run đang diễn ra:**

- **Không** chèn tài liệu vào system prompt và không sửa block tài liệu cũ, vì cả hai thao tác này làm mất cache từ vị trí thay đổi trở đi.
- Tài liệu cần được lưu thành một **phiên bản mới** trong storage. Sau đó, hệ thống **nối thêm** một message vào cuối history, ví dụ: "User đã thêm tài liệu X (id, tóm tắt ngắn)". Agent đọc tài liệu qua tool khi cần. Với tài liệu nhỏ và quan trọng, toàn bộ nội dung có thể được đưa trực tiếp vào message này.
- Kích thước tool result cần được giới hạn bằng phân trang hoặc cắt bớt. Một lần đọc 50k token sẽ nằm trong context cho đến lần compact tiếp theo.

### 9. Subagent

Subagent là **một tool được implement bằng một agent loop khác**.

- **Định nghĩa:** Claude Code cung cấp sẵn một số loại subagent (ví dụ Explore, Plan, general-purpose). User cũng có thể tự định nghĩa subagent trong file `.claude/agents/<tên>.md`, gồm `name`, `description`, danh sách `tools` được phép sử dụng, `model`, và phần nội dung được dùng làm system prompt.
- **Quyết định gọi:** model tự gọi tool `Agent` khi description của một subagent phù hợp với task, **hoặc** user yêu cầu sử dụng một subagent cụ thể. System prompt có thể giới hạn hành vi này, ví dụ bằng quy định "chỉ spawn subagent khi user yêu cầu".
- **Thực thi:** client/harness chịu trách nhiệm thực thi, không phải server của model. Client khởi tạo một **vòng lặp mới với mảng messages rỗng**, sử dụng system prompt và tools riêng của subagent. Khi subagent hoàn thành, chỉ **câu trả lời cuối cùng** được gửi về agent cha dưới dạng `tool_result`.

| Ưu điểm | Nhược điểm |
|---|---|
| Context của agent cha được giữ ngắn gọn, vì các bước trung gian chỉ nằm trong context của agent con | Agent con không có thông tin nào ngoài task được giao, nên task phải được mô tả đầy đủ |
| Có thể dùng model rẻ hơn cho các task đơn giản | Tổng số lượt gọi tăng; phát sinh overhead đối với task nhỏ |
| Có thể chạy song song | Các chi tiết mà agent cha không yêu cầu sẽ không được trả về |
| Các subagent cùng loại dùng chung prefix đã được cache | Khó debug nếu không có trace |

Subagent phù hợp với các task có nhiều bước trung gian (tìm kiếm, đọc nhiều file) mà agent cha chỉ cần kết luận. Đối với task nhỏ, việc dùng subagent không mang lại lợi ích.

---

## Phần III - Case study: Claude Code

### 10. Kiến trúc của CLI

```text
[Máy của user: tiến trình claude CLI]
   - chạy agent loop
   - thực thi tool (bash, đọc/sửa file)
   - lưu history vào ~/.claude/projects/<project>/<session-id>.jsonl
        |
        |  HTTPS + SSE, gọi trực tiếp
        v
[api.anthropic.com]   (hoặc Bedrock / Vertex / proxy thông qua ANTHROPIC_BASE_URL)
   - chạy model, lưu prompt cache trong thời hạn TTL
   - KHÔNG lưu hội thoại
```

- Claude Code **không sử dụng server trung gian**. Tiến trình CLI trên máy user đóng vai trò backend, còn file `.jsonl` đóng vai trò event log.
- Mỗi dòng trong file `.jsonl` là một event: message của user, message của assistant, tool call, tool result, snapshot file hoặc thay đổi setting.
- Trường hợp ngoại lệ là các session chạy trên cloud/web: agent loop giữ nguyên cách hoạt động nhưng được thực thi trên một VM từ xa.
- Stream gốc có thể được quan sát bằng lệnh sau:

  ```bash
  claude -p "list files in this repo" --output-format stream-json --verbose
  ```

  Output của lệnh hiển thị từng message, `tool_use`, `tool_result` và `usage`, bao gồm cả `cache_read_input_tokens`.
- Để xây dựng agent với cùng mô hình vòng lặp, có thể tham khảo **Claude Agent SDK** (Python / TypeScript).

### 11. Resume session sau một thời gian gián đoạn

Khi user chạy `claude --continue` hoặc `claude --resume` vào ngày hôm sau:

1. Cache của session đã hết hạn, vì TTL tối đa là 1 giờ.
2. CLI đọc file `.jsonl`, tạo lại mảng messages và gửi request gồm:
   - **system prompt được tạo mới** (ngày hiện tại, git status hiện tại, `CLAUDE.md` và memory được đọc lại), vì vậy có thể khác với system prompt của ngày trước đó
   - danh sách tools
   - **toàn bộ history**: message của user và assistant, mọi tool call và tool result ở dạng nguyên văn; nếu session đã được compact, phần history trước thời điểm compact chỉ còn bản tóm tắt
3. Request đầu tiên phải **ghi cache cho toàn bộ prefix** (chi phí khoảng 1.25x toàn bộ context) và có thời gian phản hồi dài hơn bình thường. Các request tiếp theo có chi phí thấp như trước.

Từ đó có thể thấy, khi resume một session dài sau thời gian gián đoạn, hệ thống nên compact trước, hoặc chỉ nạp bản tóm tắt cùng artifact hiện tại thay vì toàn bộ history.

### 12. Việc duy trì connection giữa các thành phần

**Ở tầng transport (TCP/TLS socket), connection có thể được duy trì và nên được duy trì.** HTTP client trong các SDK sử dụng connection pool với keep-alive / HTTP2, nhờ đó các request sau dùng lại socket đã có và không phải thực hiện lại TLS handshake. Mỗi ứng dụng chỉ nên tạo **một client object dùng chung**, thay vì tạo client mới cho mỗi lần gọi. Socket không được sử dụng trong thời gian dài sẽ bị server hoặc load balancer đóng; khi đó connection pool tự động mở socket mới mà code ứng dụng không cần xử lý.

**Ở tầng logic (session/state), connection không lưu trạng thái.** Messages API hoạt động theo mô hình request/response. API không hỗ trợ việc mở một session rồi tiếp tục trao đổi trên session đó. Hai request dù được gửi qua cùng một socket vẫn hoàn toàn độc lập, và request sau vẫn phải chứa đầy đủ history. Một số provider cung cấp API realtime qua WebSocket, chủ yếu phục vụ voice; đây là trường hợp riêng và không thuộc phạm vi tài liệu này.

**So sánh streaming và non-streaming:**

| | Non-streaming | Streaming |
|---|---|---|
| Hành vi của connection | Không có dữ liệu trong suốt quá trình sinh; toàn bộ kết quả được trả về dưới dạng một object JSON khi hoàn tất | Dữ liệu được gửi liên tục, kèm các event `ping` định kỳ |
| Rủi ro | Câu trả lời dài có thể bị proxy hoặc client ngắt do timeout; SDK cảnh báo hoặc từ chối request khi `max_tokens` lớn | Ít có nguy cơ bị ngắt do idle |
| UX | User không thấy kết quả cho đến khi hoàn tất | Thinking, text và tool input được hiển thị ngay khi được sinh |
| Trường hợp phù hợp | Lời gọi ngắn, tác vụ chạy nền, tác vụ dạng batch | **Lựa chọn mặc định cho agent** |

**Hủy request đang xử lý:** việc đóng stream làm model dừng generate token. Các token đã được sinh trước thời điểm đóng vẫn bị tính phí. Nút "Stop" trong các ứng dụng agent hoạt động theo cơ chế này.

---

## Phần IV - Backend gọi LLM API bên ngoài

Phần này xét một mô hình phổ biến: backend chạy agent loop và gọi LLM của một hoặc nhiều provider bên ngoài qua API.

### 13. Khác biệt API giữa các provider

Các provider dùng chung các khái niệm (messages, tool call, usage, streaming), nhưng tên field và cấu trúc của cả request lẫn response đều khác nhau. Bảng dưới so sánh ba API phổ biến:

| Khía cạnh | Anthropic Messages | OpenAI Chat Completions | Google Gemini |
|---|---|---|---|
| System prompt | field `system` riêng ở top-level | một message có `role: "system"` | field `systemInstruction` |
| Nội dung message | mảng content block (`text`, `image`, `tool_use`, ...) | `content` là string hoặc mảng part | `contents[].parts[]` |
| Role của model | `assistant` | `assistant` | `model` |
| Tool call | block `tool_use`, `input` là **object JSON** | `message.tool_calls[]`, `arguments` là **string JSON** và phải được parse | part `functionCall` |
| Tool result | block `tool_result` nằm trong message `user` | message riêng có `role: "tool"` và `tool_call_id` | part `functionResponse` |
| Lý do dừng | `stop_reason`: `end_turn`, `tool_use`, `max_tokens` | `finish_reason`: `stop`, `tool_calls`, `length` | `finishReason`: `STOP`, `MAX_TOKENS`, ... |
| Số kết quả trả về | một message | mảng `choices[]` | mảng `candidates[]` |
| Usage | `input_tokens`, `output_tokens`, `cache_read_input_tokens`, `cache_creation_input_tokens` | `prompt_tokens`, `completion_tokens`, `prompt_tokens_details.cached_tokens` | `usageMetadata.promptTokenCount`, `candidatesTokenCount` |
| Streaming | event có type (`message_start`, `content_block_delta`, ...) | các chunk `delta`, kết thúc bằng `data: [DONE]` | các chunk response nối tiếp nhau |
| Thinking / reasoning | block `thinking` kèm `signature`, phải được gửi lại nguyên vẹn ở lượt sau | reasoning item (thường ở dạng mã hóa) | thought summary |

Một số điểm khác biệt cần lưu ý:

- **Usage trong chế độ streaming:** Anthropic trả usage trong event `message_start` (phần input) và `message_delta` (phần output). OpenAI chỉ trả usage trong chunk cuối cùng khi request có tham số `stream_options: {include_usage: true}`.
- **Server-side state:** một số API mới cho phép server lưu hội thoại thay cho client, ví dụ OpenAI Responses API với `previous_response_id`. Tính stateless mô tả ở mục 1 vì vậy không đúng tuyệt đối với mọi API. Tuy nhiên, tính năng này chủ yếu giúp client không phải tự gửi lại history; toàn bộ history vẫn được tính là input token ở mỗi lượt, nên chi phí không giảm. Chi tiết billing cần được kiểm tra trong tài liệu của từng provider.

### 14. Lớp chuẩn hóa giữa các provider

Khi backend cần hỗ trợ nhiều provider, cách làm phổ biến là xây dựng **một format chuẩn nội bộ và một adapter cho mỗi provider**:

```text
Agent code  <->  format chuẩn nội bộ  <->  adapter Anthropic / OpenAI / Gemini  <->  provider API
               (messages, tool_calls,     (chuyển đổi request đi,
                usage, stream events)      response và stream event về)
```

Agent code chỉ làm việc với format chuẩn. Adapter chịu trách nhiệm chuyển đổi theo **cả hai chiều**: request gửi đi, response trả về, và từng stream event.

Các phương án triển khai:

| Phương án | Ưu điểm | Nhược điểm |
|---|---|---|
| **Thư viện chat model của framework** (ví dụ LangChain) | Đã chuẩn hóa sẵn tool call và usage (ví dụ `AIMessage.tool_calls`, `usage_metadata` với `input_tokens`, `output_tokens`, `input_token_details.cache_read`); đổi provider bằng cách đổi chuỗi `provider:model` | Tính năng riêng của provider phải được truyền qua tham số đặc thù; thư viện thay đổi phiên bản thường xuyên |
| **LiteLLM** (SDK hoặc proxy) | Mọi provider đều dùng format OpenAI; có sẵn chức năng budget, rate limit và tính chi phí | Format OpenAI không biểu diễn được toàn bộ tính năng của các provider khác |
| **Gateway như OpenRouter** | Một API key cho nhiều provider, format tương thích OpenAI, có thể trả chi phí trong usage | Phụ thuộc vào bên trung gian; cần kiểm tra prompt caching có được chuyển tiếp hay không |
| **Tự viết adapter** | Kiểm soát hoàn toàn | Tốn công xây dựng và phải cập nhật khi API của provider thay đổi |

Đánh đổi quan trọng nhất của việc chuẩn hóa là format chung thường chỉ biểu diễn được phần giao của các provider. Những tính năng như `cache_control`, `signature` của thinking hay citations dễ bị mất khi đi qua lớp chuẩn hóa. Do đó, format nội bộ nên có một field dành cho dữ liệu đặc thù của provider (ví dụ `provider_extras` hoặc `raw`), và event log nên lưu cả response gốc để phục vụ debug.

### 15. Số liệu do server tính và số liệu do client tính

| Số liệu | Bên tính | Chi tiết |
|---|---|---|
| **Số token của request và response** | **Server của provider** | Mỗi model có tokenizer riêng, và tokenizer của một số model (ví dụ Claude) không được công khai, nên client không thể tự đếm chính xác. Giá trị trong `usage` là căn cứ tính tiền. Để biết số token trước khi gửi, có thể dùng endpoint đếm token (ví dụ `count_tokens`) hoặc ước lượng khoảng 4 ký tự tiếng Anh cho một token; văn bản tiếng Việt thường tốn nhiều token hơn. |
| **Giới hạn context window** | **Thông số cố định của model** | Được công bố trong tài liệu hoặc qua endpoint danh sách model (ví dụ `/models` của OpenRouter có field `context_length`). Server kiểm tra giới hạn này và trả lỗi 400 khi prompt quá dài. |
| **Tỉ lệ context đã sử dụng** | **Client** | Tính bằng tổng input token của response gần nhất chia cho giới hạn context window. Chỉ số phần trăm context của Claude Code được tính theo cách này; server không trả sẵn giá trị đó. |
| **Rate limit** | **Server** | Được trả qua response header (ví dụ `anthropic-ratelimit-tokens-remaining`, `x-ratelimit-remaining-tokens`) và qua lỗi 429 kèm header `retry-after`. |
| **Chi phí** | Thường do **client** tính | Nhân từng loại token trong `usage` với bảng giá tương ứng. Một số gateway như OpenRouter hoặc LiteLLM tính sẵn chi phí. |
| **Quota của từng end user** | **Backend của ứng dụng** | Provider chỉ biết organization gọi API, không biết end user nào đứng sau request. Backend phải ghi `usage` của từng bước vào DB theo user và run, cộng dồn, và kiểm tra budget **trước khi** gọi LLM. |

Tóm lại, server của provider là nguồn dữ liệu chính xác cho số token và rate limit. Mọi số liệu tổng hợp ở tầng ứng dụng (tỉ lệ context, chi phí theo user hoặc theo agent, quota) đều do backend tính từ `usage` được trả về. Đây là lý do event log cần lưu `usage` của từng bước.

### 16. Chiến lược caching khi backend gọi LLM bên ngoài

Khi dùng model của provider bên ngoài, backend không thể tự lưu KV cache; KV cache chỉ tồn tại trên server của provider. Việc backend có thể làm là **tổ chức request sao cho provider cache được**, và bổ sung các lớp cache ở tầng ứng dụng:

```text
[Backend: agent loop]
   |-- (2) cache ở tầng ứng dụng: response, tool result, embedding  (Redis / DB)
   |-- (3) checkpoint: chạy lại từ một bước mà không gọi lại các bước trước
   v
[Provider API]
   |-- (1) prompt caching: KV cache của prefix  (lớp tiết kiệm nhiều nhất)
```

#### 16.1. Prompt caching phía provider

**Cách kích hoạt ở từng provider:**

| Provider | Cơ chế | Việc backend cần làm |
|---|---|---|
| **Anthropic** | Cache tường minh | Đặt `cache_control` (tối đa 4 breakpoint) vào content block của system, tool hoặc message cuối |
| **OpenAI** | Tự động cache prefix khi prompt đủ dài (khoảng từ 1024 token) | Giữ prefix ổn định; có thể truyền `prompt_cache_key` để các request cùng prefix được định tuyến về cùng một nơi xử lý |
| **Gemini** | Implicit caching trên các model mới, và API `CachedContent` để tạo cache tường minh kèm TTL | Tạo cache tường minh cho tài liệu lớn được dùng trong thời gian dài; cache tường minh có tính phí lưu trữ theo thời gian |
| **Gateway (OpenRouter / LiteLLM)** | Chuyển tiếp request tới provider gốc | Kiểm tra `cache_control` có được chuyển tiếp hay không, và các request có được định tuyến về cùng một provider hay không; nếu request bị chuyển sang provider khác, cache không hit |

Cơ chế caching của các provider thay đổi khá thường xuyên, vì vậy cần đối chiếu tài liệu khi triển khai và kiểm tra hiệu quả bằng field usage thực tế (mục 16.5).

**Các lỗi thường gặp khi dùng agent framework (ví dụ LangGraph):**

- State lưu messages theo cơ chế nối thêm (ví dụ reducer `add_messages`) phù hợp với caching. Tính chất này bị phá vỡ khi history bị cắt ở mỗi bước (ví dụ bằng `trim_messages`) hoặc khi message cũ bị sửa hay xóa khỏi state.
- System prompt được tạo động ở mỗi node, chứa thời gian hiện tại, trạng thái run hoặc artifact hiện tại, làm mất cache từ system trở đi. Nội dung động cần được chuyển xuống cuối request dưới dạng một message mới.
- Danh sách tool truyền vào `bind_tools` (hoặc hàm tương đương) phải có thứ tự cố định và không được lọc động theo từng bước.
- Schema của tool và JSON trong message phải được serialize thành cùng một chuỗi byte ở mọi lần gọi.

**Đặc thù của hệ multi-agent:**

- Mỗi role agent có prefix riêng và ổn định (tools và system của role đó). Các lần gọi cùng một role, kể cả ở các run khác nhau của các user khác nhau trong cùng organization, dùng chung cache của phần prefix này.
- Cache chỉ được sử dụng sau khi request đầu tiên bắt đầu trả kết quả. Nếu nhiều subagent cùng loại được gửi đồng thời, tất cả đều miss và đều phải trả phí ghi cache. Cách xử lý là cache warm-up: gửi một request trước, sau đó mới gửi đồng thời các request còn lại.
- Context của subagent nên đặt phần dùng chung (requirement, tài liệu cốt lõi) ở đầu và phần task riêng ở cuối, để các subagent dùng chung được prefix.

**Lựa chọn TTL khi run phải chờ phản hồi của user:**

| Cách xử lý | Chi phí | Trường hợp phù hợp |
|---|---|---|
| TTL 5 phút (ghi cache 1.25x) | Thấp nhất nếu user phản hồi nhanh; nếu thời gian chờ vượt quá TTL, toàn bộ cache phải được ghi lại khi run tiếp tục | Các bước chạy liên tục, không chờ user |
| TTL 1 giờ (ghi cache 2x) | Chi phí ghi cao hơn, nhưng không phải ghi lại nếu user phản hồi trong vòng 1 giờ | Các bước kết thúc bằng câu hỏi hoặc yêu cầu review |
| Compact trước khi tiếp tục | Chi phí một lần tóm tắt | User quay lại sau nhiều giờ hoặc nhiều ngày |

#### 16.2. Cache ở tầng ứng dụng

| Loại cache | Cách thực hiện | Trường hợp có ích | Rủi ro |
|---|---|---|---|
| **Exact-match response cache** | Dùng hash của model, tham số và toàn bộ messages làm key, lưu response làm value (ví dụ trong Redis) | Lời gọi có tính tất định (classification, extraction, temperature 0); chạy lại eval hoặc test; replay trong quá trình phát triển | Hầu như không hit trong agent loop, vì history của mỗi run đều khác nhau |
| **Semantic cache** | Tạo embedding cho câu hỏi, tìm câu hỏi tương tự đã có câu trả lời | Chatbot dạng FAQ | **Không phù hợp với agent:** hai yêu cầu có nội dung gần giống nhau vẫn có thể cần kết quả khác nhau |
| **Tool result cache** | Cache output của các tool tốn kém (web search, parse PDF, đọc tài liệu lớn), key gồm input và phiên bản dữ liệu | Nhiều agent hoặc nhiều run đọc cùng một nguồn dữ liệu | Dữ liệu lỗi thời; cần cơ chế invalidation theo phiên bản |
| **Embedding cache** | Dùng hash nội dung của chunk làm key | Tài liệu được index lại nhiều lần | Rủi ro thấp |

#### 16.3. Checkpoint

Các agent framework như LangGraph có checkpointer lưu state sau mỗi node. Khi một bước lỗi hoặc user yêu cầu chạy lại một bước, hệ thống tiếp tục từ checkpoint thay vì chạy lại toàn bộ run, nên các lời gọi LLM trước đó không phải thực hiện lại. Với các run dài gồm nhiều agent, cơ chế này tiết kiệm đáng kể chi phí khi xảy ra lỗi.

#### 16.4. Các biện pháp giảm token khác

- **Chiến lược context** (mục 7): dùng structured state thay cho full history, giới hạn kích thước tool result, và yêu cầu subagent chỉ trả về kết luận.
- **Model routing:** các role đơn giản (phân loại, trích xuất, tóm tắt) dùng model rẻ; các role điều phối và review dùng model mạnh.
- **Batch API** (rẻ hơn khoảng 50%) cho các tác vụ không cần kết quả ngay, ví dụ chạy eval.
- **Giới hạn** `max_tokens` và số bước tối đa của mỗi run.

#### 16.5. Đo lường hiệu quả caching

Backend cần ghi `usage` của mỗi lời gọi LLM vào event log hoặc công cụ tracing (ví dụ Langfuse), và tính chỉ số:

```text
cache hit rate = cache_read / (cache_read + cache_creation + input token không được cache)
```

- Nếu tỉ lệ này của một agent loop thấp từ bước thứ ba trở đi (ví dụ dưới 70%), prefix gần như chắc chắn đang bị thay đổi ở đâu đó. Nguyên nhân có thể được xác định bằng cách so sánh request của hai bước liên tiếp.
- Tên field khác nhau giữa các provider (`cache_read_input_tokens`, `cached_tokens`, ...). Khi đã có lớp chuẩn hóa (mục 14), chỉ số này nên được đọc từ field đã chuẩn hóa, ví dụ `usage_metadata.input_token_details.cache_read` trong LangChain.
- Nên có một test tự động chạy hai bước liên tiếp của mỗi agent và kiểm tra bước thứ hai có `cache_read > 0`. Test này phát hiện ngay trường hợp system prompt bị thêm nội dung động.

**Trường hợp tự host model:** khi chạy model open-source bằng vLLM hoặc SGLang, server tự hỗ trợ prefix caching (automatic prefix caching, RadixAttention), và các nguyên tắc về prefix ở trên vẫn áp dụng. Với model của provider bên ngoài, backend chỉ có ba lớp cache như đã mô tả.

**Thứ tự ưu tiên khi triển khai:**

1. Giữ prefix ổn định và kích hoạt prompt caching cho từng provider.
2. Đo cache hit rate.
3. Áp dụng chiến lược context và model routing.
4. Dùng checkpoint để chạy lại từ bước lỗi.
5. Bổ sung tool result cache và exact-match cache cho eval khi cần.

---

## Phần V - Chuyển từ CLI local sang hệ thống web nhiều người dùng

### 17. So sánh CLI local và server tập trung

| | CLI local | Server tập trung + web UI |
|---|---|---|
| Đối tượng sử dụng | Developer | Mọi user |
| Truy cập file và terminal local | Hỗ trợ trực tiếp | Cần sandbox hoặc chức năng upload |
| Nhiều user, nhiều thiết bị, chia sẻ dữ liệu | Khó thực hiện | Hỗ trợ trực tiếp |
| Run tiếp tục chạy khi user tắt máy | Không | Có |
| Người khác review artifact | Khó thực hiện | Hỗ trợ trực tiếp |
| Nơi lưu state | File local | DB |

Các sản phẩm đã phát triển ổn định, trong đó có Claude Code khi bổ sung phiên bản web/cloud, đều áp dụng cùng một mô hình: **server chứa toàn bộ logic và dữ liệu, còn mọi giao diện đều là client của cùng một API.** Web UI phục vụ user thông thường, CLI (nếu có) phục vụ developer, và cả hai sử dụng chung một bộ endpoint.

Trong hệ thống web, trình duyệt không thể lưu API key hay thực thi tool một cách an toàn. Vì vậy, hệ thống cần một **backend đảm nhận vai trò của tiến trình CLI trong môi trường local**:

| Claude Code (local) | Hệ thống web |
|---|---|
| Tiến trình CLI | Backend / worker |
| File transcript `.jsonl` | Bảng event log trong DB |
| Terminal UI render event | Frontend subscribe SSE |
| `--resume` đọc file `.jsonl` | Nạp lại run từ DB và tạo lại messages |

### 18. Phân tách API server và worker

Hệ thống có hai loại công việc với đặc điểm khác nhau:

| | API server | Worker |
|---|---|---|
| Nhiệm vụ | Xử lý HTTP: tạo run, trả danh sách, xác thực, **phục vụ SSE stream** | **Chạy agent loop**: gọi LLM, thực thi tool, ghi event |
| Thời gian xử lý mỗi tác vụ | Tính bằng mili giây (SSE kéo dài nhưng hầu như không sử dụng CPU) | Từ vài phút đến vài giờ |
| Yếu tố quyết định việc scale | Số user đang mở trang | Số run chạy đồng thời, bị giới hạn bởi rate limit của LLM |

```text
Browser --POST /runs-->  [API server] --enqueue job--> [Queue: Redis]
                              |                              |
                              | GET /runs/{id}/stream (SSE)  v
                              |                        [Worker 1..N]
                              |                         - agent loop
                              |                         - gọi LLM
                              |                         - thực thi tool (sandbox)
                              |                              |
                              +<-- subscribe -- [Redis pub/sub] <-- publish event
                              +<-- replay ----- [Postgres: runs, events, artifacts] <-- ghi event
```

- **SSE endpoint vẫn thuộc API server.** Endpoint này chỉ subscribe pub/sub và chuyển tiếp event xuống trình duyệt, nên không cần tách thành service riêng.
- Worker là **một tiến trình hoặc container riêng**, thường dùng chung codebase với API server nhưng có entrypoint khác (ví dụ `uvicorn app:api` và `arq worker`). Trong docker-compose, hệ thống có hai service là `api` và `worker`.

Các phương án triển khai:

| Phương án | Ưu điểm | Nhược điểm | Trường hợp phù hợp |
|---|---|---|---|
| **Background task trong cùng tiến trình** (asyncio task trong tiến trình API) | Đơn giản nhất; không cần thêm hạ tầng | Restart hoặc deploy API làm dừng các run đang chạy; không thể scale worker độc lập | MVP, hệ thống chạy một instance |
| **Queue + worker riêng** (arq / Celery + Redis) | Deploy không ảnh hưởng đến run; scale worker độc lập; việc thực thi tool được cách ly khỏi tiến trình quản lý xác thực và DB; job lỗi có thể được retry | Số lượng thành phần cần vận hành tăng | Nhiều user, run kéo dài, môi trường production |
| **Agent server có sẵn** (ví dụ LangGraph Agent Server) | Cung cấp sẵn phần lớn chức năng về run, streaming và checkpoint | Ít quyền kiểm soát; phụ thuộc vào nền tảng | Khi chi phí tự xây dựng quá lớn |

Trên thực tế, hệ thống có thể bắt đầu với background task trong cùng tiến trình, với điều kiện event được truyền **qua DB / pub-sub** ngay từ đầu thay vì được ghi trực tiếp từ loop vào HTTP response. Khi đáp ứng điều kiện này, việc chuyển loop sang worker về sau chỉ là thay đổi nơi thực thi.

### 19. Truyền stream xuống trình duyệt

**Các phương án transport:**

| Phương án | Ưu điểm | Nhược điểm | Trường hợp phù hợp |
|---|---|---|---|
| **SSE qua `EventSource`** | Được trình duyệt hỗ trợ sẵn; tự kết nối lại kèm `Last-Event-ID`; tương thích tốt với proxy | Chỉ hỗ trợ GET, không có body, **không cho phép đặt header tùy ý** (chỉ gửi được cookie) | Xác thực bằng cookie |
| **SSE qua `fetch` + `ReadableStream`** (hoặc thư viện `@microsoft/fetch-event-source`) | Hỗ trợ mọi method và header (ví dụ `Authorization: Bearer`) | Phải tự xử lý việc kết nối lại và `Last-Event-ID`, hoặc sử dụng thư viện | Xác thực bằng token |
| **WebSocket** | Truyền dữ liệu hai chiều, overhead trên mỗi message thấp | Phức tạp hơn; proxy và load balancer cần cấu hình riêng; phải tự xử lý việc kết nối lại và gửi lại event | Trao đổi hai chiều liên tục (collaborative editing, voice) |
| **Polling** | Rất đơn giản | Độ trễ cao, tốn tài nguyên | Chỉ dùng làm phương án dự phòng |

Trong một agent run, dữ liệu chủ yếu được truyền từ server xuống client, còn các thao tác của client (trả lời câu hỏi, hủy run) chỉ là một số POST request riêng lẻ. Vì vậy, **SSE đáp ứng đủ yêu cầu**.

**Lý do tách thành hai bước POST để tạo run và GET để nhận event.** `EventSource` chỉ gửi được GET request và không có body, trong khi requirement có thể rất dài. Do đó, quy trình được chia thành hai bước:

```js
// Bước 1: tạo run, requirement được gửi trong body
const { run_id } = await fetch("/runs", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ requirement: "..." }),
}).then(r => r.json());

// Bước 2: nhận event bằng GET
const es = new EventSource(`/runs/${run_id}/stream`);
es.addEventListener("token", e => render(JSON.parse(e.data)));
```

Cách tách này còn có một lợi ích khác: khi user tải lại trang hoặc mở run từ thiết bị khác, client chỉ cần thực hiện lại bước 2 mà không tạo run mới.

**Các phương án xác thực cho stream:**

| Phương án | Cách thực hiện | Đánh đổi |
|---|---|---|
| **Cookie session HttpOnly** | `EventSource` tự động gửi cookie | Đơn giản nhất; các endpoint POST cần có biện pháp chống CSRF |
| **Bearer token trong header** | Dùng `fetch` và tự đọc stream, hoặc dùng thư viện | Phù hợp với hệ thống dùng JWT; phải tự xử lý logic kết nối lại |
| **Token ngắn hạn trong query string** (`?token=...`) | Server cấp một token chỉ dùng cho stream, có hiệu lực từ vài giây đến vài phút | Tương thích với `EventSource`; URL thường được ghi vào log, vì vậy không được dùng token chính cho mục đích này |

Ví dụ về cách đọc stream thủ công:

```js
const res = await fetch(`/runs/${run_id}/stream`, {
  headers: { Authorization: `Bearer ${token}` },
});
const reader = res.body.getReader();   // ReadableStream: nhận từng khối dữ liệu ngay khi server ghi xuống
const decoder = new TextDecoder();
let buf = "";
while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  buf += decoder.decode(value, { stream: true });
  // tách buffer theo "\n\n" thành từng event, sau đó parse các dòng "event:", "data:", "id:"
}
```

**Hai connection độc lập trong hệ thống:**

| Connection | Bên khởi tạo | Bên duy trì | Thời gian tồn tại |
|---|---|---|---|
| Browser <-> backend (SSE) | Browser | Backend | Trong suốt run; có thể bị ngắt và kết nối lại nhiều lần |
| Backend <-> LLM API (HTTP stream) | Backend | Server LLM trong thời gian generate token | **Một bước**; đóng khi nhận event `message_stop` |

Hai connection này **không được nối trực tiếp** với nhau. Trong thời gian tool đang chạy hoặc run đang chờ user trả lời, không có stream nào tới LLM được mở.

**Các vấn đề thường gặp khi triển khai:**

- Server cần gửi heartbeat (`: ping`) khoảng 15 giây một lần để proxy và load balancer không đóng stream khi không có dữ liệu, ví dụ trong lúc một tool chạy lâu.
- Buffering ở proxy cần được tắt (nginx `proxy_buffering off` hoặc header `X-Accel-Buffering: no`); nếu không, các event bị gộp lại và chỉ được gửi theo từng đợt.
- Response cần có header `Cache-Control: no-cache` để trình duyệt, proxy và CDN không cache stream.
- Hệ thống nên dùng HTTP/2. Với HTTP/1.1, trình duyệt chỉ cho phép khoảng 6 connection trên mỗi domain, nên việc mở nhiều tab SSE sẽ khiến các connection sau bị chặn.

### 20. Event log

Event log là nơi mọi event của một run (bắt đầu bước, token, tool call, tool result, tạo artifact, đặt câu hỏi, usage) được ghi vào storage bền vững, mỗi event kèm một `id` tăng dần.

Event log đáp ứng bốn nhu cầu:

1. **Replay:** khi kết nối lại, client gửi `Last-Event-ID` và nhận lại các event chưa nhận được; việc tải lại trang không làm mất tiến trình.
2. **Resume:** run có thể được tiếp tục sau nhiều giờ hoặc nhiều ngày bằng cách tạo lại messages và state từ storage, tương tự lệnh `--resume` của CLI.
3. **Human-in-the-loop:** agent gọi một tool dạng `ask_user` (với LangGraph là `interrupt()`) và run chuyển sang trạng thái "interrupted". Khi nhận được POST request chứa câu trả lời, hệ thống nối thêm `tool_result` (hoặc giá trị resume) và tiếp tục run.
4. **Debug và theo dõi chi phí:** `usage` của từng bước cho biết số token, tỉ lệ cache hit và chi phí của từng agent.

Vì LLM không lưu bất kỳ state nào, event log là nơi lưu state thực sự của hệ thống.

---

## Phần VI - Checklist

Checklist này được dùng để kiểm tra design trước và sau khi triển khai.

**Stateless và context**

- [ ] Mọi context mà model cần đều được tạo lại từ storage bền vững; hệ thống không giả định model lưu thông tin giữa các lần gọi.
- [ ] Mỗi agent có chiến lược context rõ ràng (full history / compaction / structured state / retrieval) và có giới hạn kích thước.
- [ ] Compaction được triển khai làm biện pháp dự phòng, và bản tóm tắt được đặt sau system prompt.
- [ ] Kích thước tool result được giới hạn (phân trang, cắt bớt).

**Prompt caching**

- [ ] Request được sắp xếp theo thứ tự nội dung tĩnh trước, nội dung động sau: tools -> system -> tài liệu tham khảo -> state -> history -> input mới.
- [ ] Phần đầu system prompt không chứa timestamp, ID hay dữ liệu riêng của từng user.
- [ ] Danh sách và thứ tự tool không thay đổi trong suốt một run; JSON được serialize theo thứ tự cố định.
- [ ] History chỉ được nối thêm vào cuối, không bị sửa ở giữa (không dùng sliding window).
- [ ] Cache breakpoint đã được đặt (với Claude), hoặc cơ chế caching của provider đã được xác định rõ (với các provider khác / OpenRouter).
- [ ] `cache_read_input_tokens` và `input_tokens` được ghi log, và tỉ lệ cache hit được theo dõi.
- [ ] Chi phí ghi lại toàn bộ cache khi resume một run đã dừng lâu đã được tính đến (hoặc hệ thống compact trước khi resume).
- [ ] Trước khi gửi đồng thời nhiều subagent cùng loại, hệ thống gửi một request trước để tạo cache (cache warm-up).
- [ ] TTL của cache được chọn theo thời gian chờ user dự kiến ở từng bước.
- [ ] Có test tự động kiểm tra bước thứ hai của mỗi agent có `cache_read > 0`.

**Làm việc với nhiều provider**

- [ ] Agent code chỉ làm việc với format chuẩn nội bộ; mọi chuyển đổi request, response và stream event nằm trong adapter.
- [ ] Format chuẩn có chỗ chứa dữ liệu đặc thù của provider, và event log lưu response gốc.
- [ ] Các tính năng đặc thù đang dùng (`cache_control`, `signature` của thinking, citations) đã được kiểm tra là đi qua lớp chuẩn hóa hoặc gateway mà không bị mất.
- [ ] Gateway định tuyến các request cùng prefix về cùng một provider.
- [ ] Usage streaming được bật ở các provider cần tham số riêng (ví dụ `stream_options.include_usage` của OpenAI).
- [ ] Tỉ lệ context, chi phí và quota theo user được backend tính từ `usage`; budget được kiểm tra trước mỗi lời gọi LLM.
- [ ] Lỗi 429 được xử lý theo header `retry-after`.

**Agent loop và tool**

- [ ] Mọi dạng response mà UI cần render (câu hỏi kèm lựa chọn, artifact, plan) đều được định nghĩa thành tool có schema chặt chẽ.
- [ ] Human-in-the-loop được thực hiện bằng tool hoặc interrupt để tạm dừng run, không phải bằng cách chờ blocking.
- [ ] Các tool call độc lập và các subagent độc lập được chạy song song.
- [ ] Subagent nhận mô tả task đầy đủ và chỉ trả về kết luận.
- [ ] Model rẻ hơn được sử dụng ở những vị trí mà chất lượng cho phép (cấu hình model theo từng role).
- [ ] Hệ thống có các giới hạn: số bước tối đa, timeout cho từng tool, số token / chi phí tối đa cho mỗi run.

**Tài liệu và artifact**

- [ ] Tài liệu nhỏ và luôn cần sử dụng được nạp một lần ở gần đầu request, kèm cache breakpoint.
- [ ] Tài liệu lớn hoặc nhiều tài liệu được truy cập qua tool (context chỉ chứa danh mục, nội dung được lấy khi cần).
- [ ] Tài liệu mới hoặc tài liệu được sửa được lưu thành phiên bản mới và được thông báo bằng một message nối vào cuối, không làm thay đổi prefix.
- [ ] Artifact được lưu bên ngoài context; context chỉ chứa phiên bản hiện tại hoặc tham chiếu đến artifact.
- [ ] Output của các tool tốn kém và embedding được cache theo input và phiên bản dữ liệu; không dùng semantic cache cho agent.

**Run, worker và streaming**

- [ ] Run được mô hình hóa thành một resource (`POST` để tạo, `GET` để nhận stream), không gắn với một HTTP request duy nhất.
- [ ] Event được truyền theo đường loop -> DB / pub-sub -> SSE, không được ghi trực tiếp từ loop vào HTTP response.
- [ ] Mỗi event có `id` tăng dần; khi client kết nối lại với `Last-Event-ID`, các event chưa nhận được sẽ được gửi lại.
- [ ] Việc đóng trình duyệt không làm dừng run; việc hủy run sẽ đóng stream tới LLM.
- [ ] Việc deploy hoặc restart API không làm mất các run đang chạy (hoặc đây là giới hạn đã được ghi nhận của bản MVP).
- [ ] Phương án xác thực cho stream đã được chọn (cookie / fetch kèm header / token ngắn hạn trong query).
- [ ] Hệ thống có heartbeat, đã tắt buffering ở proxy, trả header `Cache-Control: no-cache` và dùng HTTP/2.
- [ ] Mỗi tiến trình dùng một LLM client chung (connection pooling) và bật streaming.

**Observability**

- [ ] Với mỗi bước: model, latency, số token input / cache read / cache write / output, chi phí.
- [ ] Với mỗi run: tổng chi phí, số bước, tỉ lệ cache hit, chi phí của từng agent.
- [ ] Trace cho phép xem lại run theo từng bước (ví dụ Langfuse / LangSmith).

---

## Thuật ngữ

| Thuật ngữ | Ý nghĩa |
|---|---|
| **Stateless API** | API trong đó mỗi request độc lập với nhau; server không lưu hội thoại |
| **Harness / client** | Chương trình chạy agent loop, lưu history, thực thi tool và render UI |
| **Agent loop** | Quy trình lặp: gọi model -> thực thi các tool được yêu cầu -> gửi kết quả lại cho model, cho đến khi hoàn thành |
| **`tool_use` / `tool_result`** | Yêu cầu gọi tool do model sinh ra / kết quả thực thi tool do client gửi lại |
| **SSE** | Server-Sent Events: một HTTP response kéo dài, chứa một chuỗi event dạng text |
| **Prefill / decode** | Giai đoạn đọc input / giai đoạn sinh output |
| **KV cache** | Các tensor nội bộ được tính trong giai đoạn prefill; đây là dữ liệu mà prompt caching lưu lại |
| **Breakpoint (`cache_control`)** | Điểm đánh dấu vị trí kết thúc của prefix cần cache |
| **TTL** | Thời gian một cache entry tồn tại khi không được sử dụng |
| **Compaction** | Thao tác thay thế phần history cũ bằng bản tóm tắt |
| **Subagent** | Tool được implement bằng một agent loop khác, có context riêng và không có history ban đầu |
| **Event log** | Bản ghi bền vững, có thứ tự, về mọi sự kiện đã xảy ra trong một run |
| **Adapter** | Thành phần chuyển đổi giữa format chuẩn nội bộ và format API của một provider cụ thể |
| **Cache warm-up** | Gửi trước một request để tạo cache, sau đó mới gửi đồng thời các request có cùng prefix |
| **Exact-match cache** | Cache response theo key là hash của toàn bộ request; chỉ hit khi request giống hệt |
| **Semantic cache** | Cache response theo mức độ tương đồng ngữ nghĩa của câu hỏi |
| **Rate limit** | Giới hạn số request hoặc số token trong một khoảng thời gian do provider áp dụng |
| **`Last-Event-ID`** | Header mà client SSE gửi khi kết nối lại để server gửi tiếp từ đúng vị trí |

## Các điểm cần kiểm chứng thêm

- Giá cụ thể, độ dài tối thiểu để được cache và các tùy chọn TTL của từng model sẽ sử dụng. Các con số trong tài liệu này là giá trị xấp xỉ và cần được đối chiếu với tài liệu của provider khi ra quyết định.
- Cách prompt caching hoạt động khi request đi qua OpenRouter / LiteLLM đối với từng provider (cache tường minh hay tự động, `cache_control` có được chuyển tiếp hay không).
- Cách từng thư viện chuẩn hóa hoặc gateway xử lý usage, thinking và prompt caching của từng provider.
- Cách tính phí input token khi dùng tính năng server-side state (ví dụ `previous_response_id` của OpenAI Responses API).
- Mối tương ứng giữa các chế độ streaming và checkpointer của LangGraph với mô hình event log được mô tả trong tài liệu này.

## Bước tiếp theo

Sau giai đoạn tìm hiểu, bước tiếp theo khi xây dựng một hệ thống agent là design. Các nội dung cần quyết định gồm: run lifecycle, endpoint, SSE event schema, chiến lược context và caching cho từng agent, lớp chuẩn hóa provider, và mô hình triển khai API server / worker. Mỗi quyết định nên được ghi lại dưới dạng ADR (Architecture Decision Record), gồm bối cảnh, các phương án đã xem xét, quyết định và trade-off.
