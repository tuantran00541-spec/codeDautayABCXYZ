 const display = document.getElementById('display');
        let lichsu =[];
        let ans = 0;
        function clearDisplay(){
            display.value ='';
            lichsu = [];
        }
        function deleteLast(){
            lichsu.pop();
            display.value = lichsu.map(item => item.value).join('');
        }
        function appendValue(value){
            display.value +=value;
            lichsu.push({value: value});
        }
       function calculate(){
            try{
                let input = display.value;
                if (!input) return;
                input = input.replace(/%/g, '/100');
                let token = tokenize(input);
                if (!token) { display.value = 'error'; return; }
                let rpn = shuntingYard(token);
                console.log('RPN:', rpn);
                let result = evaluateRPN(rpn);
                display.value = parseFloat(result.toFixed(10));
                lichsu = [];
                ans = result;
            } catch(e){
                display.value = 'error';
            }
        }
        function tokenize(input){
        return input.match(/\d*\.?\d+|[a-z]+|[-+/*^!]|[()]/g);
        }
        function shuntingYard(token){
            let output = [];
            let operatorStack = [];
            let prevToken = null;
            const precedence = {
                '+':1,
                '-':1,
                '/':2,
                '*':2,
                '^':3,
                '!':4,
                'neg':4};
                const rightAssociative = { '^': true };
                for (let i =0; i < token.length; i++){
                let t = token[i];
                if (t ==="-" && (prevToken === null || prevToken === "(" || /[-+/*^]/.test(prevToken) ||/[a-z]+/.test(prevToken))){
                    t ='neg';
                }
                if (/\d+\.?\d*/.test(t)){
                    output.push(t);
                } else if (/[a-z]+/.test(t) || t === "neg"){
                    operatorStack.push(t);
                } else if(t ==="("){
                    operatorStack.push(t);
                } else if (t ===")"){
                    while (operatorStack[operatorStack.length - 1] !=="("){
                        let op = operatorStack.pop();
                        output.push(op);
                    }
                     operatorStack.pop();
                    if (operatorStack.length > 0 && /[a-z]+/.test(operatorStack[operatorStack.length - 1])) {
                        output.push(operatorStack.pop());
                    }
                } else if (/[-+/*^!]/.test(t)){
                    while(operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !=="(" && (rightAssociative[t] 
                             ? precedence[operatorStack[operatorStack.length - 1]] > precedence[t]
                             : precedence[operatorStack[operatorStack.length - 1]] >= precedence[t])
                        ){
                        output.push(operatorStack.pop());
                    }
                    operatorStack.push(t);
                } 
                prevToken = t;
                }
                while(operatorStack.length > 0){
                    output.push(operatorStack.pop());
                }
                return output;
        }
        function evaluateRPN(rpn){
            let stack =[];
            for (let i =0; i < rpn.length; i++){
                let t =rpn[i];
                if (!isNaN(parseFloat(t))){
                    stack.push(parseFloat(t));
                }else if (t ==="!"){
                    let a = stack.pop();
                    stack.push(factorial(a));
                }
                else if (/[-+/*^]/.test(t)){
                   let b = stack.pop();
                   let a = stack.pop();
                   if (t ==="+"){
                    stack.push(a + b);
                   }else if (t ==="-"){
                    stack.push(a - b);
                   }else if (t ==="/"){
                    stack.push(a/b);
                   }else if (t ==="^"){
                    stack.push(Math.pow(a, b));
                   }else if ( t ==="*"){
                    stack.push(a*b);
                   }
                }else if (/[a-z]+/.test(t)){
                    let a = stack.pop();
                    if (t ==="sin"){
                        stack.push(Math.sin(a*Math.PI/180));
                    }else if (t === "cos"){
                        stack.push(Math.cos(a*Math.PI/180));
                    }else if ( t ==="log"){
                        stack.push(Math.log10(a));
                    }else if ( t ==="sqrt"){
                        stack.push(Math.sqrt(a));
                    }else if (t ==="tan"){
                        stack.push(Math.tan(a*Math.PI/180));
                    }else if (t ==="ln"){
                        stack.push(Math.log(a));
                    }else if (t ==="e"){
                        stack.push(Math.E);
                    }else if (t ==="pi"){
                        stack.push(Math.PI);
                    }else if (t ==="sq"){
                        stack.push(a * a);
                    }else if (t ==="cb"){
                        stack.push(a*a*a);
                    }else if (t ==="inv"){
                        stack.push(1/a);
                    }else if (t ==="abs"){
                        stack.push(Math.abs(a));
                    }else  if( t ==="neg"){
                        stack.push(-a);
                    }
                }
            }
            return stack[0];
        }
        function percent(){
            display.value +='%';
        }
        function factorial(a){
            if (a === 0 || a === 1) return 1;
            let result = 1;
            for(let i =2; i <= a; i++){
                result *= i;
            }
            return result;
        }
        function appendAns(){
            display.value += ans;
        }