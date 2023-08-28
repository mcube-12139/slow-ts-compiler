/**
 * 1 * 2 + 3
 * 1 + 2 * 3;
 * 1(2, 3)
 * 
 * mov 1
 * push
 * mov 2
 * mul
 * push
 * mov 3
 * add
 * 
 * mov 1
 * push
 * mov 2
 * push
 * mov 3
 * mul
 * add
 * 
 * movfc 1
 * push
 * mov 2
 * push
 * mov 3
 * push
 * callc 3
 * 
 */

const TokenType = {
    END: 0,
    IDENTIFIER: 1,
    CHAR: 2,
    STRING_LITERAL: 3,
    NUMBER_LITERAL: 4
};

const SymbolType = {
    VARIABLE: 0,
    KEYWORD: 1,
    UNDEFINED: 2
};

const StsAction = {
    CALLC: 0,
    MOV: 1,
    MOVS: 2,
    PUSH: 3,
    PUSHS: 4,
    GLOBAL: 5,
    GLOBALS: 6,
    STORE: 7,
    STORES: 8,
    LOAD: 9,
    LOADS: 10
};

const StsByteCodeType = {
    ACTION: 0,
    NUMBER: 1,
    STRING: 2,
    FUNC: 3,
};

const StsValueType = {
    NUMBER: 0,
    STRING: 1,
    BOOLEAN: 2,
    ARRAY: 3,
    OBJECT: 4,
    UNDEFINED: 5,
    FUNC: 6
};

const StsFunc = {
    GET_STRING: 0,
    SHOW_MESSAGE: 1
};

const StsKeyword = {
    LET: 0,
    NUMBER: 1,
    STRING: 2,
    BOOLEAN: 3,
    ARRAY: 4,
    OBJECT: 5,
    UNDEFINED: 6
};

class StsCompiler {
    constructor() {
        this.source = "";
        this.lineIndex = 0;
        this.lastPos = 0;
        this.pos = 0;

        this.symbolMap = new Map();
        this.tokenType = TokenType.IDENTIFIER;
        this.exprValueType = StsValueType.NUMBER;
        /**
         * @type {StsSymbol?}
         */
        this.symbol = null;
        this.charValue = "";
        this.stringLiteral = "";
        this.numberLiteral = 0;
        this.nowAddress = -1;

        /**
         * @type {StsByteCode}
         */
        this.byteCode = null;
    }
    /**
     * 
     * @param {string} source 
     * @returns {StsByteCode}
     */
    compileToByteCode(source) {
        this.source = source;
        this.lineIndex = 0;
        this.pos = 0;
        this.tokenType = TokenType.IDENTIFIER;
        this.exprValueType = StsValueType.NUMBER;
        this.symbol = null;
        this.charValue = "";
        this.stringLiteral = "";
        this.numberLiteral = 0;
        this.nowAddress = -1;

        this.symbolMap.clear();
        this.symbolMap.set("show_message", StsSymbol.newFunc(StsFunc.SHOW_MESSAGE, [
            new StsParameter(StsValueType.STRING)
        ], StsValueType.UNDEFINED));
        this.symbolMap.set("get_string", StsSymbol.newFunc(StsFunc.GET_STRING, [], StsValueType.STRING));

        this.symbolMap.set("let", StsSymbol.newKeyword(StsKeyword.LET));
        this.symbolMap.set("number", StsSymbol.newKeyword(StsKeyword.NUMBER));
        this.symbolMap.set("string", StsSymbol.newKeyword(StsKeyword.STRING));
        this.symbolMap.set("boolean", StsSymbol.newKeyword(StsKeyword.BOOLEAN));
        this.symbolMap.set("array", StsSymbol.newKeyword(StsKeyword.ARRAY));
        this.symbolMap.set("object", StsSymbol.newKeyword(StsKeyword.OBJECT));
        this.symbolMap.set("undefined", StsSymbol.newKeyword(StsKeyword.UNDEFINED));

        this.byteCode = new StsByteCode();

        // 读取 statement_list
        this.readToken();
        this.readStmtList();

        return this.byteCode;
    }

    tokenIsChar(ch) {
        return this.tokenType == TokenType.CHAR && this.charValue == ch;
    }

    tokenIsKeyword(keyword) {
        return this.tokenType == TokenType.IDENTIFIER && this.symbol.type == SymbolType.KEYWORD && this.symbol.keyword == keyword;
    }

    nextAddress() {
        ++this.nowAddress;
        return this.nowAddress;
    }

    readToken() {
        // 跳过空白符
        while (this.pos < this.source.length) {
            const c = this.source.charCodeAt(this.pos);
            if (c == 32 || c == 9 || c == 10 || c == 13) {
                ++this.pos;
                if (c == 10) {
                    ++this.lineIndex;
                }
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
                } else {
                    const symbol = StsSymbol.newUndefined();
                    this.symbolMap.set(idenName, symbol);
                    this.symbol = symbol;
                }
            } else if (c == 34) {
                // '"'
                this.tokenType = TokenType.STRING_LITERAL;
                ++this.pos;
                const start = this.pos;
                for ( ; ; ) {
                    if (this.pos >= this.source.length) {
                        this.abort("Expect \"");
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
            } else if (c == 46 || (c >= 48 && c <= 57)) {
                // 数字字面量
                this.tokenType = TokenType.NUMBER_LITERAL;

                let beforePoint = true;
                let unitAfterPoint = 1;
                let radix = 10;
                let result = 0;

                if (c == 48) {
                    // '0'
                    ++this.pos;
                    c = this.source.charCodeAt(this.pos);
                    if (c == 46) {
                        // '.'
                        ++this.pos;
                        beforePoint = false;
                    } else if (c == 120) {
                        // 'x'
                        ++this.pos;
                        radix = 16;
                    } else if (c == 98) {
                        // 'b'
                        ++this.pos;
                        radix = 2;
                    } else if (c >= 48 && c <= 55) {
                        // '0'-'7'
                        radix = 8;
                    }
                }
                for ( ; ; ) {
                    c = this.source.charCodeAt(this.pos);
                    if (c >= 48 && c < 48 + radix) {
                        // 当前进制合法数字
                        const num = c - 48;
                        if (beforePoint) {
                            result = radix * result + num;
                        } else {
                            // 小数只能是十进制
                            unitAfterPoint *= 0.1;
                            result += unitAfterPoint * num;
                        }
                        ++this.pos;
                    } else if (c == 46) {
                        if (radix == 10 && beforePoint) {
                            // 十进制小数点
                            beforePoint = false;
                            ++this.pos;
                        } else {
                            break;
                        }
                    } else {
                        break;
                    }
                }

                this.numberLiteral = result;
            } else {
                this.tokenType = TokenType.CHAR;
                this.charValue = this.source[this.pos];
                ++this.pos;
            }
        }
    }

    readStmtList() {
        if (this.tokenIsChar("{")) {
            // '{' -> [statement_block][statement_list]
            // 读取 statement_block
            this.readToken();
            this.readStmtList();
            if (!this.tokenIsChar("}")) {
                throw "Expect '}'";
            }
            this.readToken();

            this.readStmtList();
        } else if (this.tokenIsChar(";") || this.tokenType == TokenType.STRING_LITERAL || this.tokenType == TokenType.IDENTIFIER) {
            // ';' | string_literal | identifier -> [statement][statement_list]
            // 读取 statement
            if (this.tokenIsChar(";")) {
                // ';' -> ';'
                // do nothing
                this.readToken();
            } else if (this.tokenIsKeyword(StsKeyword.LET)) {
                // [let] -> [let_statement]
                // 读取 let_statement
                this.readToken();
                if (this.tokenType != TokenType.IDENTIFIER) {
                    this.abort("Expect [identifier]");
                }
                if (this.symbol.type != SymbolType.UNDEFINED) {
                    this.abort("Identifier name is already used");
                }
                const symbol = this.symbol;

                this.readToken();
                let typeDescribed = false;
                let variableType = StsValueType.UNDEFINED;
                let initialized = false;
                if (this.tokenIsChar(":")) {
                    // ':' -> [type_description]
                    typeDescribed = true;

                    this.readToken();
                    if (this.tokenType != TokenType.IDENTIFIER) {
                        this.abort("Expect [identifier]");
                    }
                    if (this.symbol.type != SymbolType.KEYWORD) {
                        this.abort("Expect [keyword]");
                    }

                    if (this.tokenIsKeyword(StsKeyword.STRING)) {
                        variableType = StsValueType.STRING;
                    } else if (this.tokenIsKeyword(StsKeyword.NUMBER)) {
                        variableType = StsValueType.NUMBER;
                    } else if (this.tokenIsKeyword(StsKeyword.BOOLEAN)) {
                        variableType = StsValueType.BOOLEAN;
                    } else if (this.tokenIsKeyword(StsKeyword.UNDEFINED)) {
                        variableType = StsValueType.UNDEFINED;
                    }

                    this.readToken();
                }
                if (this.tokenIsChar("=")) {
                    // '=' -> [initialization]
                    initialized = true;

                    this.readToken();
                    this.readExpr();
                    if (typeDescribed && this.exprValueType != variableType) {
                        debugger;
                        this.abort("Type dismatch");
                    }
                    variableType = this.exprValueType;
                }
                if (this.tokenIsChar(";")) {
                    // ';' -> ';'
                    this.readToken();
                } else {
                    this.abort("Expect ':', '=' or ';'");
                }

                symbol.type = SymbolType.VARIABLE;
                symbol.valueType = variableType;
                symbol.address = this.nextAddress();
                if (variableType == StsValueType.STRING) {
                    this.byteCode.pushAction(StsAction.GLOBALS);
                    if (initialized) {
                        this.byteCode.pushAction(StsAction.STORES);
                    }
                } else {
                    this.byteCode.pushAction(StsAction.GLOBAL);
                    if (initialized) {
                        this.byteCode.pushAction(StsAction.STORE);
                    }
                }
            } else {
                // [string_literal] | [identifier] -> [expression] ';'
                this.readExpr();
                if (!this.tokenIsChar(";")) {
                    throw "Expect ';'";
                }
                this.readToken();
            }

            this.readStmtList();
        } else {
            // null
            // do nothing

            return;
        }
    }

    readExpr() {
        if (this.tokenType == TokenType.STRING_LITERAL || this.tokenType == TokenType.IDENTIFIER) {
            // [string_literal] | [identifier] -> [expression_atom][function_call_or_null]
            let funcReturnType;
            if (this.tokenType == TokenType.STRING_LITERAL) {
                this.byteCode.pushAction(StsAction.MOVS);
                this.byteCode.pushStringCode(this.stringLiteral);

                this.exprValueType = StsValueType.STRING;
            } else {
                if (this.symbol.type != SymbolType.VARIABLE) {
                    this.abort("Expect variable");
                }
                if (this.symbol.valueType == StsValueType.STRING) {
                    this.byteCode.pushAction(StsAction.LOADS);
                    this.byteCode.pushNumberCode(this.symbol.address);

                    this.exprValueType = StsValueType.STRING;
                } else if (this.symbol.valueType == StsValueType.FUNC) {
                    this.byteCode.pushAction(StsAction.MOV);
                    this.byteCode.pushFuncCode(this.symbol.code);

                    this.exprValueType = StsValueType.FUNC;
                    funcReturnType = this.symbol.returnType;
                }
            }
            this.readToken();

            // 读取 function_call_or_null
            if (this.tokenIsChar("(")) {
                // '(' -> '(' [parameter_list] ')'
                if (this.exprValueType != StsValueType.FUNC) {
                    this.abort("Expect functionc");
                }
                this.byteCode.pushAction(StsAction.PUSH);
    
                this.readToken();
                let paramCount = 0;
                if (this.tokenType == TokenType.STRING_LITERAL || this.tokenType == TokenType.IDENTIFIER) {
                    // [string_literal] | [identifier] -> [parameter_list]
                    paramCount = this.readParamList();
                }
                if (!this.tokenIsChar(")")) {
                    throw "Expect ')'";
                }
                this.readToken();

                this.byteCode.pushAction(StsAction.CALLC);
                this.byteCode.pushNumberCode(paramCount);

                this.exprValueType = funcReturnType;
            } else {
                // null
            }
        }
    }

    readParamList() {
        let result = 0;

        if (this.tokenType == TokenType.STRING_LITERAL || this.tokenType == TokenType.IDENTIFIER) {
            // string_literal | identifier -> expression
            this.readExpr();
            ++result;
            if (this.exprValueType == StsValueType.STRING) {
                this.byteCode.pushAction(StsAction.PUSHS);
            }

            // 读取 parameter_list_left
            if (this.tokenIsChar(",")) {
                // ',' -> ','[parameter_list]
                this.readToken();
                result += this.readParamList();
            } else {
                // null
                // do nothing
            }
        } else {
            // null
            // do nothing
        }

        return result;
    }

    stringifyToken() {
        if (this.tokenType == TokenType.CHAR) {
            return this.charValue;
        } else if (this.tokenType == TokenType.IDENTIFIER) {
            return this.symbol;
        } else if (this.tokenType == TokenType.STRING_LITERAL) {
            return `"${this.stringLiteral}"`;
        }
    }

    abort(err) {
        throw `${err}\n行: ${this.lineIndex + 1}`;
    }
}

class StsByteCode {
    static actionNameMap = [];
    static funcNameMap = [];

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
                } else if (unit.type == StsByteCodeType.FUNC) {
                    result += " ";
                    result += StsByteCode.stringifyFunc(unit.code);
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
    pushFuncCode(fun) {
        this.data.push({
            type: StsByteCodeType.FUNC,
            code: fun
        });
    }

    static stringifyAction(action) {
        return this.actionNameMap[action];
    }

    static stringifyFunc(fun) {
        return this.funcNameMap[fun];
    }
}
StsByteCode.actionNameMap[StsAction.CALLC] = "callc";
StsByteCode.actionNameMap[StsAction.MOV] = "mov";
StsByteCode.actionNameMap[StsAction.MOVS] = "movs";
StsByteCode.actionNameMap[StsAction.PUSH] = "push";
StsByteCode.actionNameMap[StsAction.PUSHS] = "pushs";
StsByteCode.actionNameMap[StsAction.GLOBAL] = "global";
StsByteCode.actionNameMap[StsAction.GLOBALS] = "globals";
StsByteCode.actionNameMap[StsAction.STORE] = "store";
StsByteCode.actionNameMap[StsAction.STORES] = "stores";
StsByteCode.actionNameMap[StsAction.LOAD] = "load";
StsByteCode.actionNameMap[StsAction.LOADS] = "loads";

StsByteCode.funcNameMap[StsFunc.GET_STRING] = "get_string";
StsByteCode.funcNameMap[StsFunc.SHOW_MESSAGE] = "show_message";

class StsSymbol {
    constructor() {
        this.type = SymbolType.VARIABLE;

        this.code = StsFunc.GET_STRING;
        this.valueType = StsValueType.UNDEFINED;
        this.address = 0;
        /**
         * @type {StsParameter[]}
         */
        this.paramArr = [];
        this.returnType = StsValueType.UNDEFINED;

        this.keyword = StsKeyword.LET;
    }
    /**
     * 
     * @param {number} code 
     * @param {StsParameter[]} paramArr
     * @param {number} returnType
     * @returns {StsSymbol}
     */
    static newFunc(code, paramArr, returnType) {
        const result = new this();

        result.type = SymbolType.VARIABLE;
        result.valueType = StsValueType.FUNC;
        result.code = code;
        result.paramArr = paramArr;
        result.returnType = returnType;

        return result;
    }
    /**
     * 
     * @param {number} valueType 
     * @param {number} address 
     * @returns {StsSymbol}
     */
    static newVariable(valueType, address) {
        const result = new this();

        result.type = SymbolType.VARIABLE;
        result.valueType = valueType;
        result.address = address;

        return result;
    }
    /**
     * 
     * @param {number} keyword
     * @returns {StsSymbol}
     */
    static newKeyword(keyword) {
        const result = new this();

        result.type = SymbolType.KEYWORD;
        result.keyword = keyword;

        return result;
    }

    /**
     * 
     * @returns {StsSymbol}
     */
    static newUndefined() {
        const result = new this();

        result.type = SymbolType.UNDEFINED;

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