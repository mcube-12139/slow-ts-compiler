const TokenType = {
    END: 0,
    IDENTIFIER: 1,
    CHAR: 2,
    STRING_LITERAL: 3
};

const SymbolType = {
    VARIABLE: 0
};

const StsAction = {
    SHOW_MESSAGE: 0,
    GET_STRING: 1,
    MOVES: 2,
    MOVE: 3
};

const StsByteCodeType = {
    ACTION: 0,
    NUMBER: 1,
    STRING: 2
};

const StsValueType = {
    NUMBER: 0,
    STRING: 1,
    BOOLEAN: 2,
    ARRAY: 3,
    OBJECT: 4,
    UNDEFINED: 5
};

class StsCompiler {
    constructor() {
        this.source = "";
        this.pos = 0;

        this.symbolMap = new Map();
        this.tokenType = TokenType.IDENTIFIER;
        /**
         * @type {StsSymbol?}
         */
        this.symbol = null;
        this.charValue = "";
        this.stringLiteral = "";

        this.byteCode = null;
    }
    /**
     * 
     * @param {string} source 
     * @returns {StsByteCode}
     */
    compileToByteCode(source) {
        this.source = source;
        this.pos = 0;
        this.tokenType = TokenType.IDENTIFIER;
        this.symbol = null;
        this.charValue = "";
        this.stringLiteral = "";

        this.symbolMap.clear();
        this.symbolMap.set("show_message", StsSymbol.newEngineCall(StsAction.SHOW_MESSAGE, [
            new StsParameter(StsValueType.STRING)
        ]));
        this.symbolMap.set("get_string", StsSymbol.newEngineCall(StsAction.GET_STRING, []));

        this.byteCode = new StsByteCode();

        this.readToken();
        if (this.tokenType != TokenType.END) {
            // 读取statement_list
            this.readStmtList();
        }
        for ( ; ; ) {
            this.readToken();
            if (this.tokenType == TokenType.IDENTIFIER) {
                // 表达式
                this.readToken();
                if (this.tokenType != TokenType.CHAR || this.charValue != "(") {
                    // '('
                    throw "No (";
                }

                // 参数列表
                for (const param of this.symbol.paramArr) {
                    const valueType = param.valueType;
                }
                this.readToken();
                if (this.tokenType != TokenType.STRING_LITERAL) {
                    throw "Except [string]";
                }
                const message = this.stringLiteral;

                this.readToken();
                if (this.tokenType != TokenType.CHAR || this.charValue != ")") {
                    // ')'
                    throw "No )";
                }

                this.readToken();
                if (this.tokenType != TokenType.CHAR || this.charValue != ";") {
                    // ';'
                    throw "No ;";
                }

                result.pushAction(StsAction.SHOW_MESSAGE);
                result.pushStringCode(message);
            } else if (this.tokenType == TokenType.END) {
                break;
            }
        }

        return this.byteCode;
    }

    tokenIsChar(ch) {
        return this.tokenType == TokenType.CHAR && this.charValue == ch;
    }

    readToken() {
        // 跳过空白符
        while (this.pos < this.source.length) {
            const c = this.source.charCodeAt(this.pos);
            if (c == 32 || c == 9 || c == 10) {
                ++this.pos;
            } else {
                break;
            }
        }

        if (this.pos >= this.source.length) {
            this.tokenType = TokenType.END;
        } else {
            let c = this.source.charCodeAt(this.pos);

            if (c == 95 || (c >= 97 && c <= 122) || (c >= 65 && c <= 90)) {
                // 标识符
                this.tokenType = TokenType.IDENTIFIER;
                const start = this.pos;
                for ( ; ; ) {
                    ++this.pos;
                    if (this.pos >= this.source.length) {
                        // 源码用完，打破
                        break;
                    }

                    c = this.source.charCodeAt(this.pos);
                    if (c != 95 && (c < 97 || c > 122) && (c < 65 || c > 90) && (c < 48 || c > 57)) {
                        // 遇到标识符以外字符，打破
                        break;
                    }
                }

                const idenName = this.source.substring(start, this.pos);
                if (this.symbolMap.has(idenName)) {
                    this.symbol = this.symbolMap.get(idenName);
                }
            } else if (c == 34) {
                this.tokenType = TokenType.STRING_LITERAL;
                ++this.pos;
                const start = this.pos;
                for ( ; ; ) {
                    if (this.pos >= this.source.length) {
                        throw "Expect \"";
                    }
                    c = this.source.charCodeAt(this.pos);
                    if (c == 34) {
                        break;
                    } else {
                        ++this.pos;
                    }
                }

                this.stringLiteral = this.source.substring(start, this.pos);
                ++this.pos;
            } else {
                this.tokenType = TokenType.CHAR;
                this.charValue = this.source[this.pos];
                ++this.pos;
            }
        }
    }

    readStmtList() {
        if (this.tokenIsChar("{")) {
            // '{' -> statement_block
            this.readToken();
            this.readStmtList();
            if (!this.tokenIsChar("}")) {
                throw "Expect '}'";
            }
        } else if (this.tokenIsChar(";") || this.tokenType == TokenType.STRING_LITERAL || this.tokenType == TokenType.IDENTIFIER) {
            // ';' | string_literal | identifier -> statement
            if (this.tokenIsChar(";")) {
                // ';' -> ';'
                // do nothing
            } else {
                // string_literal | identifier -> expression
                this.readExpr();
                if (!this.tokenIsChar(";")) {
                    throw "Expect ';'";
                }
            }
        } else {
            throw "Expect [statement] or [statement_block]";
        }

        this.readToken();
    }

    readExpr() {
        if (this.tokenType == TokenType.STRING_LITERAL) {
            // string_literal -> string_literal
            this.byteCode.pushAction(StsAction.MOVES);
            this.byteCode.pushStringCode(this.stringLiteral);
        } else if (this.tokenType == TokenType.IDENTIFIER) {
            if (this.symbol.type == SymbolType.VARIABLE) {
                if (!this.symbol.mutable) {
                    // 常量
                    if (this.symbol.valueType == StsValueType.NUMBER) {
                        this.byteCode.pushAction(StsAction.MOVE);
                        this.byteCode.pushNumberCode(this.symbol.code);
                    }
                }
            }
        }

        this.readToken();
    }
}

class StsByteCode {
    static actionStringMap = [];

    constructor() {
        this.data = [];
    }
    stringify() {
        let result = "";

        for (let i = 0; i < this.data.length; ) {
            let unit = this.data[i];
            
            result += StsByteCode.stringifyAction(unit.code);
            ++i;
            for ( ; i < this.data.length; ) {
                unit = this.data[i];
                if (unit.type == StsByteCodeType.ACTION) {
                    break;
                } else if (unit.type == StsByteCodeType.NUMBER) {
                    result += " ";
                    result += unit.code.toString();
                    ++i;
                } else if (unit.type == StsByteCodeType.STRING) {
                    result += " ";
                    result += `"${unit.code}"`;
                    ++i;
                }
            }
            result += "\n";
        }

        return result;
    }
    pushAction(action) {
        this.data.push({
            type: StsByteCodeType.ACTION,
            code: action
        });
    }
    pushStringCode(str) {
        this.data.push({
            type: StsByteCodeType.STRING,
            code: str
        });
    }
    pushNumberCode(num) {
        this.data.push({
            type: StsByteCodeType.NUMBER,
            code: num
        });
    }

    static stringifyAction(action) {
        return this.actionStringMap[action];
    }
}
StsByteCode.actionStringMap[StsAction.SHOW_MESSAGE] = "show_message";

class StsSymbol {
    constructor() {
        this.type = SymbolType.VARIABLE;
        this.code = StsAction.SHOW_MESSAGE;
        this.mutable = false;
        this.valueType = StsValueType.UNDEFINED;
        /**
         * @type {StsParameter[]}
         */
        this.paramArr = [];
    }
    /**
     * 
     * @param {number} code 
     * @param {StsParameter[]} paramArr 
     * @returns 
     */
    static newEngineCall(code, paramArr) {
        const result = new this();

        result.type = SymbolType.VARIABLE;
        result.code = code;
        result.paramArr = paramArr;

        return result;
    }
}

class StsParameter {
    constructor(valueType) {
        this.valueType = valueType;
    }
}

const request = new XMLHttpRequest();
request.open("GET", "source.ts", false);
request.send(null);

const compiler = new StsCompiler();
const result = compiler.compileToByteCode(request.responseText);

console.log(result.stringify());