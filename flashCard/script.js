// ============================================================
// 1. Khai báo biến toàn cục
// ============================================================
const display = document.getElementById('display');
let lichsu = [];        // Lưu lịch sử các thao tác (hiện chỉ dùng để xóa từng ký tự)
let ans = 0;            // Lưu kết quả cuối cùng (cho nút Ans)

// ============================================================
// 2. Các hàm thao tác với màn hình nhập
// ============================================================

// Xóa toàn bộ
function clearDisplay() {
    display.value = '';
    lichsu = [];
}

// Xóa ký tự cuối cùng
function deleteLast() {
    lichsu.pop();
    display.value = lichsu.map(item => item.value).join('');
}

// Thêm một giá trị (số, toán tử, hàm, ...) vào biểu thức
function appendValue(value) {
    display.value += value;
    lichsu.push({ value: value });
}

// Thêm dấu % (chỉ thêm ký tự '%')
function percent() {
    display.value += '%';
}

// Thêm kết quả Ans vào biểu thức
function appendAns() {
    display.value += ans;
}

// ============================================================
// 3. Hàm tính toán chính
// ============================================================

function calculate() {
    try {
        let input = display.value;
        if (!input) return;

        // Thay thế ký hiệu % thành /100 (xử lý phần trăm)
        input = input.replace(/%/g, '/100');

        // Phân tích thành các token (số, hàm, toán tử, dấu ngoặc)
        let token = tokenize(input);
        if (!token) {
            display.value = 'error';
            return;
        }

        // Chuyển biểu thức trung tố sang hậu tố (RPN) bằng thuật toán Shunting-yard
        let rpn = shuntingYard(token);
        console.log('RPN:', rpn);

        // Tính giá trị của biểu thức hậu tố
        let result = evaluateRPN(rpn);

        // Hiển thị kết quả (làm tròn 10 chữ số)
        display.value = parseFloat(result.toFixed(10));
        lichsu = [];          // Xóa lịch sử sau khi tính
        ans = result;         // Lưu kết quả cho nút Ans

    } catch (e) {
        display.value = 'error';
    }
}

// ============================================================
// 4. Các hàm phụ trợ cho phân tích và tính toán
// ============================================================

// Tokenize: tách chuỗi thành các thành phần (số, từ, toán tử, ngoặc)
function tokenize(input) {
    // Biểu thức chính quy: số thập phân, chữ cái (hàm, hằng), toán tử, ngoặc
    return input.match(/\d*\.?\d+|[a-z]+|[-+/*^!]|[()]/g);
}

// Thuật toán Shunting-yard: chuyển trung tố sang hậu tố (RPN)
function shuntingYard(token) {
    let output = [];
    let operatorStack = [];
    let prevToken = null;

    // Độ ưu tiên của các toán tử
    const precedence = {
        '+': 1,
        '-': 1,
        '/': 2,
        '*': 2,
        '^': 3,
        '!': 4,
        'neg': 4
    };
    const rightAssociative = { '^': true }; // ^ là toán tử kết hợp phải

    for (let i = 0; i < token.length; i++) {
        let t = token[i];

        // Xử lý dấu trừ một ngôi (unary minus) -> chuyển thành 'neg'
        if (t === '-' && (prevToken === null || prevToken === '(' || /[-+/*^]/.test(prevToken) || /[a-z]+/.test(prevToken))) {
            t = 'neg';
        }

        // Nếu là số -> đưa thẳng ra output
        if (/\d+\.?\d*/.test(t)) {
            output.push(t);
        }
        // Nếu là hàm (chữ cái) hoặc neg -> đưa vào stack toán tử
        else if (/[a-z]+/.test(t) || t === 'neg') {
            operatorStack.push(t);
        }
        // Dấu ngoặc mở -> đưa vào stack
        else if (t === '(') {
            operatorStack.push(t);
        }
        // Dấu ngoặc đóng -> lấy các toán tử trong ngoặc ra output
        else if (t === ')') {
            while (operatorStack[operatorStack.length - 1] !== '(') {
                let op = operatorStack.pop();
                output.push(op);
            }
            operatorStack.pop(); // bỏ '('

            // Nếu sau ngoặc đóng có hàm (ví dụ sin(30) thì đẩy sin ra output)
            if (operatorStack.length > 0 && /[a-z]+/.test(operatorStack[operatorStack.length - 1])) {
                output.push(operatorStack.pop());
            }
        }
        // Các toán tử hai ngôi (+ - * / ^ !)
        else if (/[-+/*^!]/.test(t)) {
            while (
                operatorStack.length > 0 &&
                operatorStack[operatorStack.length - 1] !== '(' &&
                (
                    rightAssociative[t]
                        ? precedence[operatorStack[operatorStack.length - 1]] > precedence[t]
                        : precedence[operatorStack[operatorStack.length - 1]] >= precedence[t]
                )
            ) {
                output.push(operatorStack.pop());
            }
            operatorStack.push(t);
        }

        prevToken = t;
    }

    // Đẩy các toán tử còn lại trong stack ra output
    while (operatorStack.length > 0) {
        output.push(operatorStack.pop());
    }

    return output;
}

// Tính giá trị biểu thức hậu tố (RPN)
function evaluateRPN(rpn) {
    let stack = [];

    for (let i = 0; i < rpn.length; i++) {
        let t = rpn[i];

        // Nếu là số -> đẩy vào stack
        if (!isNaN(parseFloat(t))) {
            stack.push(parseFloat(t));
        }
        // Toán tử giai thừa (một ngôi)
        else if (t === '!') {
            let a = stack.pop();
            stack.push(factorial(a));
        }
        // Các toán tử hai ngôi
        else if (/[-+/*^]/.test(t)) {
            let b = stack.pop();
            let a = stack.pop();
            switch (t) {
                case '+': stack.push(a + b); break;
                case '-': stack.push(a - b); break;
                case '*': stack.push(a * b); break;
                case '/': stack.push(a / b); break;
                case '^': stack.push(Math.pow(a, b)); break;
            }
        }
        // Hàm hoặc hằng số (một ngôi)
        else if (/[a-z]+/.test(t)) {
            let a = stack.pop();
            switch (t) {
                case 'sin':   stack.push(Math.sin(a * Math.PI / 180)); break; // độ
                case 'cos':   stack.push(Math.cos(a * Math.PI / 180)); break;
                case 'tan':   stack.push(Math.tan(a * Math.PI / 180)); break;
                case 'log':   stack.push(Math.log10(a)); break;
                case 'ln':    stack.push(Math.log(a)); break;
                case 'sqrt':  stack.push(Math.sqrt(a)); break;
                case 'sq':    stack.push(a * a); break;
                case 'cb':    stack.push(a * a * a); break;
                case 'inv':   stack.push(1 / a); break;
                case 'abs':   stack.push(Math.abs(a)); break;
                case 'neg':   stack.push(-a); break;
                case 'e':     stack.push(Math.E); break;
                case 'pi':    stack.push(Math.PI); break;
                // Có thể thêm các hàm khác nếu cần
                default: stack.push(0); // fallback
            }
        }
    }

    return stack[0];
}

// ============================================================
// 5. Hàm tiện ích
// ============================================================

// Tính giai thừa (chỉ cho số nguyên không âm)
function factorial(a) {
    if (a === 0 || a === 1) return 1;
    let result = 1;
    for (let i = 2; i <= a; i++) {
        result *= i;
    }
    return result;
}