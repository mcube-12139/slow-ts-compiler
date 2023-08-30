/**
 * a.b()
 * a + b()
 * 
 * mov A.b
 */

const TokenType = {
    KEYWORD: 0,
    IDENTIFIER: 0,
    STRING_LITERAL: 0,
    NUMBER_LITERAL: 0,
    CHAR: 0,
    COMPOSITE: 0,
    END: 0,
};
initEnum(TokenType);
addEnumOption(TokenType, "KEYWORD");
addEnumOption(TokenType, "IDENTIFIER");
addEnumOption(TokenType, "STRING_LITERAL");
addEnumOption(TokenType, "NUMBER_LITERAL");
addEnumOption(TokenType, "CHAR");
addEnumOption(TokenType, "COMPOSITE");
addEnumOption(TokenType, "END");

const StsCompositeToken = {
    INC: 0,
    DEC: 1
};

const SymbolType = {
    VARIABLE: 0,
    KEYWORD: 1,
    UNDEFINED: 2
};

const StsAction = {
    CALLC: 0,
    MOV: 0,
    MOVS: 0,
    PUSH: 0,
    PUSHS: 0,
    STORE: 0,
    STORES: 0,
    LOAD: 0,
    LOADS: 0,
    INC: 0,
    DEC: 0,
    ADD: 0,
    ADDS: 0,
    SUB: 0,
    MUL: 0,
    DIV: 0,
    MOD: 0,
};
initEnum(StsAction);
addEnumOption(StsAction, "CALLC");
addEnumOption(StsAction, "MOV");
addEnumOption(StsAction, "MOVS");
addEnumOption(StsAction, "PUSH");
addEnumOption(StsAction, "PUSHS");
addEnumOption(StsAction, "STORE");
addEnumOption(StsAction, "STORES");
addEnumOption(StsAction, "LOAD");
addEnumOption(StsAction, "LOADS");
addEnumOption(StsAction, "INC");
addEnumOption(StsAction, "DEC");
addEnumOption(StsAction, "ADD");
addEnumOption(StsAction, "ADDS");
addEnumOption(StsAction, "SUB");
addEnumOption(StsAction, "MUL");
addEnumOption(StsAction, "DIV");
addEnumOption(StsAction, "MOD");

const StsByteCodeType = {
    ACTION: 0,
    NUMBER: 1,
    STRING: 2,
    CFUN: 3,
};

const StsValueType = {
    NUMBER: 0,
    STRING: 1,
    BOOLEAN: 2,
    ARRAY: 3,
    OBJECT: 4,
    UNDEFINED: 5,
    CFUN: 6,
    ANY: 7
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
    UNDEFINED: 6,
    TRUE: 7,
    FALSE: 8,
    CFUN: 9,
    ANY: 10,

    codeMap: new Map(),
    nameMap: [],
    codeOf(name) {
        if (this.codeMap.has(name)) {
            return this.codeMap.get(name);
        }
        return null;
    },
    stringify(keyword) {
        return this.nameMap[keyword];
    },

    setCodeName(code, name) {
        this.nameMap[code] = name;
        this.codeMap.set(name, code);
    }
};
StsKeyword.setCodeName(StsKeyword.LET, "let");
StsKeyword.setCodeName(StsKeyword.NUMBER, "number");
StsKeyword.setCodeName(StsKeyword.STRING, "string");
StsKeyword.setCodeName(StsKeyword.BOOLEAN, "boolean");
StsKeyword.setCodeName(StsKeyword.ARRAY, "array");
StsKeyword.setCodeName(StsKeyword.OBJECT, "object");
StsKeyword.setCodeName(StsKeyword.UNDEFINED, "undefined");
StsKeyword.setCodeName(StsKeyword.TRUE, "true");
StsKeyword.setCodeName(StsKeyword.FALSE, "false");
StsKeyword.setCodeName(StsKeyword.CFUN, "cfunction");
StsKeyword.setCodeName(StsKeyword.ANY, "any");

class StsCompiler {
    constructor() {
        this.source = "";
        this.lineIndex = 0;
        this.lastPos = -1;
        this.pos = -1;
        this.charCode = null;

        /**
         * @type {Map<string, StsSymbol>}
         */
        this.symbolMap = new Map();
        this.tokenType = TokenType.IDENTIFIER;
        this.exprValueType = StsValueType.NUMBER;
        /**
         * @type {StsOperator[]}
         */
        this.operatorStack = [];
        /**
         * @type {StsValueType[]}
         */
        this.operandValueTypeStack = [];
        this.identifierName = "";
        this.keyword = StsKeyword.UNDEFINED;
        this.charValue = "";
        this.compositeType = StsCompositeToken.INC;
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
        this.pos = -1;
        this.charCode = null;
        this.readChar();
        this.tokenType = TokenType.IDENTIFIER;
        this.exprValueType = StsValueType.NUMBER;
        this.operatorStack = [StsOperator.LOWEST];
        this.operandValueTypeStack = [];
        this.identifierName = "";
        this.keyword = StsKeyword.UNDEFINED;
        this.charValue = "";
        this.compositeType = StsCompositeToken.INC;
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
        this.symbolMap.set("true", StsSymbol.newKeyword(StsKeyword.TRUE));
        this.symbolMap.set("false", StsSymbol.newKeyword(StsKeyword.FALSE));

        this.byteCode = new StsByteCode();

        const syntaxRootNode = StsSyntaxNode.newProgram();
        this.readToken();
        this.readStmtList(syntaxRootNode);
        console.log(JSON.stringify(syntaxRootNode.getAndChildren()));

        this.writeByteCode(syntaxRootNode);

        return this.byteCode;
    }

    tokenIsChar(ch) {
        return this.tokenType == TokenType.CHAR && this.charValue == ch;
    }

    tokenIsKeyword(keyword) {
        return this.tokenType == TokenType.KEYWORD && this.keyword == keyword;
    }

    tokenIsComposite(compType) {
        return this.tokenType == TokenType.COMPOSITE && this.compositeType == compType;
    }

    nextAddress() {
        ++this.nowAddress;
        return this.nowAddress;
    }

    readChar() {
        ++this.pos;
        if (this.pos < this.source.length) {
            this.charCode = this.source.charCodeAt(this.pos);
        } else {
            this.charCode = null;
        }
    }

    readToken() {
        // 跳过空白符
        while (this.charCode == 32 || this.charCode == 9 || this.charCode == 10 || this.charCode == 13) {
            if (this.charCode == 10) {
                ++this.lineIndex;
            }
            this.readChar();
        }

        if (this.charCode == null) {
            this.tokenType = TokenType.END;
        } else if (
            this.charCode == 95 ||
            (this.charCode >= 97 && this.charCode <= 122) ||
            (this.charCode >= 65 && this.charCode <= 90)
        ) {
            // '_' 'a'-'z' 'A'-'Z' 标识符
            const start = this.pos;
            for (; ;) {
                this.readChar();
                if (this.charCode == null) {
                    // 源码用完，打破
                    break;
                }

                if (
                    this.charCode != 95 &&
                    (this.charCode < 97 || this.charCode > 122) &&
                    (this.charCode < 65 || this.charCode > 90) &&
                    (this.charCode < 48 || this.charCode > 57)
                ) {
                    // 遇到标识符以外字符，打破
                    break;
                }
            }

            const idenName = this.source.substring(start, this.pos);
            const keywordCode = StsKeyword.codeOf(idenName);
            if (keywordCode == null) {
                this.tokenType = TokenType.IDENTIFIER;
                this.identifierName = idenName;
            } else {
                this.tokenType = TokenType.KEYWORD;
                this.keyword = keywordCode;
            }
        } else if (this.charCode == 34) {
            // '"'
            this.tokenType = TokenType.STRING_LITERAL;
            this.readChar();
            const start = this.pos;
            for (; ;) {
                if (this.charCode == null) {
                    this.abort("Expect \"");
                }
                if (this.charCode == 34) {
                    break;
                } else {
                    this.readChar();
                }
            }

            this.stringLiteral = this.source.substring(start, this.pos);
            this.readChar();
        } else if (this.charCode == 46 || (this.charCode >= 48 && this.charCode <= 57)) {
            // '.' '0'-'9' 数字字面量
            this.tokenType = TokenType.NUMBER_LITERAL;

            let beforePoint = true;
            let unitAfterPoint = 1;
            let radix = 10;
            let result = 0;

            if (this.charCode == 48) {
                // '0'
                this.readChar();
                if (this.charCode == 46) {
                    // '.'
                    this.readChar();
                    beforePoint = false;
                } else if (this.charCode == 120) {
                    // 'x'
                    this.readChar();
                    radix = 16;
                } else if (this.charCode == 98) {
                    // 'b'
                    this.readChar();
                    radix = 2;
                } else if (this.charCode >= 48 && this.charCode <= 55) {
                    // '0'-'7'
                    radix = 8;
                }
            }
            for (; ;) {
                if (this.charCode == null) {
                    break;
                }

                let win = false;
                let num;
                if (radix == 10) {
                    // 十进制可以是小数
                    if (this.charCode >= 48 && this.charCode <= 57) {
                        win = true;
                        num = this.charCode - 48;
                    }
                } else if (beforePoint) {
                    // 非十进制必须是整数
                    if (radix == 16) {
                        if ((this.charCode >= 48 && this.charCode <= 57)) {
                            win = true;
                            num = this.charCode - 48;
                        } else if (this.charCode >= 65 && this.charCode <= 70) {
                            // 'A'-'F'
                            win = true;
                            num = this.charCode - 55;
                        } else if (this.charCode >= 97 && this.charCode <= 102) {
                            win = true;
                            num = this.charCode - 87;
                        }
                    } else if (this.charCode >= 48 && this.charCode < 48 + radix) {
                        win = true;
                        num = this.charCode - 48;
                    }
                }

                if (win) {
                    // 当前进制合法数字
                    if (beforePoint) {
                        result = radix * result + num;
                    } else {
                        unitAfterPoint *= 0.1;
                        result += unitAfterPoint * num;
                    }
                    this.readChar();
                } else if (this.charCode == 46) {
                    if (radix == 10 && beforePoint) {
                        // 十进制小数点
                        beforePoint = false;
                        this.readChar();
                    } else {
                        break;
                    }
                } else {
                    break;
                }
            }

            this.numberLiteral = result;
        } else if (this.charCode == 43) {
            // '+'
            this.readChar();
            if (this.charCode == 43) {
                // '+'
                this.tokenType = TokenType.COMPOSITE;
                this.compositeType = StsCompositeToken.INC;
                this.readChar();
            } else {
                this.tokenType = TokenType.CHAR;
                this.charValue = "+";
            }
        } else if (this.charCode == 45) {
            // '-'
            this.readChar();
            if (this.charCode == 45) {
                // '-'
                this.tokenType = TokenType.COMPOSITE;
                this.compositeType = StsCompositeToken.DEC;
                this.readChar();
            } else {
                this.tokenType = TokenType.CHAR;
                this.charValue = "-";
            }
        } else {
            this.tokenType = TokenType.CHAR;
            this.charValue = this.source[this.pos];
            this.readChar();
        }
    }

    readStmtList(parentNode) {
        if (this.tokenIsChar("{")) {
            // '{' -> [statement_block][statement_list]
            // 读取 statement_block
            const stmtBlockNode = StsSyntaxNode.newStatementBlock();

            this.readToken();
            this.readStmtList(stmtBlockNode);
            parentNode.pushChild(stmtBlockNode);

            if (!this.tokenIsChar("}")) {
                throw "Expect '}'";
            }
            this.readToken();

            this.readStmtList(parentNode);
        } else if (
            this.tokenIsChar(";") ||
            this.tokenIsComposite(StsCompositeToken.INC) ||
            this.tokenIsComposite(StsCompositeToken.DEC) ||
            this.tokenType == TokenType.STRING_LITERAL ||
            this.tokenType == TokenType.NUMBER_LITERAL ||
            this.tokenType == TokenType.KEYWORD ||
            this.tokenType == TokenType.IDENTIFIER
        ) {
            // ';' | '++' | '--' | string_literal | number_literal | [true] | [false] | identifier | [let] -> [statement][statement_list]
            // 读取 statement
            if (this.tokenIsChar(";")) {
                // ';' -> ';'
                // do nothing

                this.readToken();
            } else if (this.tokenIsKeyword(StsKeyword.LET)) {
                // [let] -> [let_statement]
                // 读取 let_statement
                const letStmtNode = StsSyntaxNode.newLetStatement();

                letStmtNode.pushChild(StsSyntaxNode.newKeyword(StsKeyword.LET));
                this.readToken();
                if (this.tokenType != TokenType.IDENTIFIER) {
                    this.abort("Expect [identifier]");
                }
                // if (this.symbol.type != SymbolType.UNDEFINED) {
                //     this.abort("Identifier name is already used");
                // }
                letStmtNode.pushChild(StsSyntaxNode.newIdentifier(this.identifierName));

                this.readToken();
                let typeDescribed = false;
                let variableType = StsValueType.UNDEFINED;
                let initialized = false;
                if (this.tokenIsChar(":")) {
                    // ':' -> [type_description]
                    const typeDescNode = StsSyntaxNode.newTypeDescription();
                    typeDescribed = true;

                    this.readToken();
                    if (this.tokenType != TokenType.KEYWORD) {
                        this.abort("Expect [keyword]");
                    }

                    if (this.tokenIsKeyword(StsKeyword.STRING)) {
                        variableType = StsValueType.STRING;
                        typeDescNode.pushChild(StsSyntaxNode.newKeyword(this.keyword));
                    } else if (this.tokenIsKeyword(StsKeyword.NUMBER)) {
                        variableType = StsValueType.NUMBER;
                        typeDescNode.pushChild(StsSyntaxNode.newKeyword(this.keyword));
                    } else if (this.tokenIsKeyword(StsKeyword.BOOLEAN)) {
                        variableType = StsValueType.BOOLEAN;
                        typeDescNode.pushChild(StsSyntaxNode.newKeyword(this.keyword));
                    } else if (this.tokenIsKeyword(StsKeyword.UNDEFINED)) {
                        variableType = StsValueType.UNDEFINED;
                        typeDescNode.pushChild(StsSyntaxNode.newKeyword(this.keyword));
                    }
                    letStmtNode.pushChild(typeDescNode);

                    this.readToken();
                }
                if (this.tokenIsChar("=")) {
                    // '=' -> [initialization]
                    initialized = true;

                    this.readToken();

                    const exprNode = StsSyntaxNode.newExpression();
                    this.readExpr(exprNode);
                    letStmtNode.pushChild(exprNode);

                    // if (typeDescribed && this.exprValueType != variableType) {
                    //     this.abort("Type dismatch");
                    // }
                    // variableType = this.exprValueType;
                }
                if (this.tokenIsChar(";")) {
                    // ';' -> ';'
                    this.readToken();
                } else {
                    this.abort("Expect ';'");
                }
                parentNode.pushChild(letStmtNode);

                // const address = this.nextAddress();
                // symbol.type = SymbolType.VARIABLE;
                // symbol.valueType = variableType;
                // symbol.address = address;
                // if (variableType == StsValueType.STRING) {
                //     if (initialized) {
                //         this.byteCode.pushAction(StsAction.STORES);
                //         this.byteCode.pushNumberCode(address);
                //     }
                // } else {
                //     if (initialized) {
                //         this.byteCode.pushAction(StsAction.STORE);
                //         this.byteCode.pushNumberCode(address);
                //     }
                // }
            } else {
                // '++' | '--' | string_literal | number_literal | identifier -> [expression] ';'
                const exprStmtNode = StsSyntaxNode.newExpressionStatement();
                const exprNode = StsSyntaxNode.newExpression();

                this.readExpr(exprNode);
                exprStmtNode.pushChild(exprNode);

                if (!this.tokenIsChar(";")) {
                    this.abort("Expect ';'");
                }
                this.readToken();

                parentNode.pushChild(exprStmtNode);
            }

            this.readStmtList(parentNode);
        } else {
            // null
            // do nothing
        }
    }

    readExpr(parentNode) {
        if (this.tokenIsComposite(StsCompositeToken.INC)) {
            // '++' -> '++' [locatable]
            parentNode.pushChild(StsSyntaxNode.newOperator(StsOperator.LEFT_INCREASE));

            this.readToken();
            if (this.tokenType != TokenType.IDENTIFIER) {
                this.abort("Expect [identifier]");
            }
            // if (this.symbol.type != SymbolType.VARIABLE) {
            //     this.abort("Expect variable");
            // }
            // if (this.symbol.valueType != StsValueType.NUMBER) {
            //     this.abort("This type cannot ++");
            // }
            parentNode.pushChild(StsSyntaxNode.newIdentifier(this.identifierName));

            // this.byteCode.pushAction(StsAction.INC);
            // this.byteCode.pushNumberCode(this.symbol.address);
            // this.byteCode.pushAction(StsAction.LOAD);
            // this.byteCode.pushNumberCode(this.symbol.address);

            this.readToken();
        } else if (this.tokenIsComposite(StsCompositeToken.DEC)) {
            // '--' -> '--' [locatable]
            parentNode.pushChild(StsSyntaxNode.newOperator(StsOperator.LEFT_DECREASE));

            this.readToken();
            if (this.tokenType != TokenType.IDENTIFIER) {
                this.abort("Expect [identifier]");
            }
            // if (this.symbol.type != SymbolType.VARIABLE) {
            //     this.abort("Expect variable");
            // }
            // if (this.symbol.valueType != StsValueType.NUMBER) {
            //     this.abort("This type cannot --");
            // }
            parentNode.pushChild(StsSyntaxNode.newIdentifier(this.identifierName));

            // this.byteCode.pushAction(StsAction.DEC);
            // this.byteCode.pushNumberCode(this.symbol.address);
            // this.byteCode.pushAction(StsAction.LOAD);
            // this.byteCode.pushNumberCode(this.symbol.address);

            this.readToken();
        } else if (
            this.tokenType == TokenType.STRING_LITERAL ||
            this.tokenType == TokenType.NUMBER_LITERAL ||
            this.tokenIsKeyword(StsKeyword.TRUE) ||
            this.tokenIsKeyword(StsKeyword.FALSE)
        ) {
            // [string_literal] | [number_literal] | [true] | [false] -> [literal][operator_or_null]
            if (this.tokenType == TokenType.STRING_LITERAL) {
                parentNode.pushChild(StsSyntaxNode.newStringLiteral(this.stringLiteral));

                // this.byteCode.pushAction(StsAction.MOVS);
                // this.byteCode.pushStringCode(this.stringLiteral);

                // this.exprValueType = StsValueType.STRING;
            } else if (this.tokenType == TokenType.NUMBER_LITERAL) {
                parentNode.pushChild(StsSyntaxNode.newNumberLiteral(this.numberLiteral));

                // this.byteCode.pushAction(StsAction.MOV);
                // this.byteCode.pushNumberCode(this.numberLiteral);

                // this.exprValueType = StsValueType.NUMBER;
            } else if (this.tokenIsKeyword(StsKeyword.TRUE)) {
                parentNode.pushChild(StsSyntaxNode.newKeyword(StsKeyword.TRUE));

                // this.byteCode.pushAction(StsAction.MOV);
                // this.byteCode.pushNumberCode(1);

                // this.exprValueType = StsValueType.BOOLEAN;
            } else if (this.tokenIsKeyword(StsKeyword.FALSE)) {
                parentNode.pushChild(StsSyntaxNode.newKeyword(StsKeyword.FALSE));

                // this.byteCode.pushAction(StsAction.MOV);
                // this.byteCode.pushNumberCode(0);

                // this.exprValueType = StsValueType.BOOLEAN;
            }
            this.readToken();

            // 读取 operator_or_null
            this.readOperatorOrNull(parentNode);
        } else if (this.tokenType == TokenType.IDENTIFIER) {
            // [identifier] -> [locatable][loperator_or_null][operator_or_null]
            parentNode.pushChild(StsSyntaxNode.newIdentifier(this.identifierName));

            let funcReturnType;
            // if (this.symbol.type != SymbolType.VARIABLE) {
            //     this.abort("Expect variable");
            // }
            // const address = this.symbol.address;
            // if (this.symbol.valueType == StsValueType.STRING) {
            //     this.byteCode.pushAction(StsAction.LOADS);
            //     this.byteCode.pushNumberCode(this.symbol.address);

            //     this.exprValueType = StsValueType.STRING;
            // } else if (this.symbol.valueType == StsValueType.NUMBER) {
            //     this.byteCode.pushAction(StsAction.LOAD);
            //     this.byteCode.pushNumberCode(this.symbol.address);

            //     this.exprValueType = StsValueType.NUMBER;
            // } else if (this.symbol.valueType == StsValueType.CFUN) {
            //     this.byteCode.pushAction(StsAction.MOV);
            //     this.byteCode.pushFuncCode(this.symbol.code);

            //     this.exprValueType = StsValueType.CFUN;
            //     funcReturnType = this.symbol.returnType;
            // }
            this.readToken();

            this.readLOperatorOrNull(parentNode);
            this.readOperatorOrNull(parentNode);
        } else {
            this.abort("Expect expression");
        }

        return parentNode;
    }

    readLOperatorOrNull(parentNode) {
        if (this.tokenIsComposite(StsCompositeToken.INC)) {
            // '++'
            parentNode.pushChild(StsSyntaxNode.newOperator(StsOperator.RIGHT_INCREASE));

            // if (this.exprValueType != StsValueType.NUMBER) {
            //     this.abort("This type of variable cannot ++");
            // }
            // this.byteCode.pushAction(StsAction.INC);
            // this.byteCode.pushNumberCode(addr);

            this.readToken();
        } else if (this.tokenIsComposite(StsCompositeToken.DEC)) {
            // '--'
            parentNode.pushChild(StsSyntaxNode.newOperator(StsOperator.RIGHT_DECREASE));

            // if (this.exprValueType != StsValueType.NUMBER) {
            //     this.abort("This type of variable cannot --");
            // }
            // this.byteCode.pushAction(StsAction.DEC);
            // this.byteCode.pushNumberCode(addr);

            this.readToken();
        } else {
            // null
        }
    }

    readOperatorOrNull(parentNode) {
        if (this.tokenIsChar("(")) {
            // '(' -> '(' [parameter_list] ')'
            parentNode.pushChild(StsSyntaxNode.newOperator(StsOperator.LEFT_FUN_CALL));

            // if (this.exprValueType != StsValueType.CFUN) {
            //     this.abort("Expect functionc");
            // }
            // this.byteCode.pushAction(StsAction.PUSH);

            this.readToken();
            let paramCount = 0;
            if (this.tokenType == TokenType.STRING_LITERAL || this.tokenType == TokenType.IDENTIFIER) {
                // [string_literal] | [identifier] -> [parameter_list]
                paramCount = this.readParamList(parentNode);
            }
            if (!this.tokenIsChar(")")) {
                throw "Expect ')'";
            }
            parentNode.pushChild(StsSyntaxNode.newOperator(StsOperator.RIGHT_FUN_CALL));
            this.readToken();

            // this.byteCode.pushAction(StsAction.CALLC);
            // this.byteCode.pushNumberCode(paramCount);

            // this.exprValueType = funcReturnType;
        } else if (this.tokenIsChar("+")) {
            // '+' -> '+' [expression]
            parentNode.pushChild(StsSyntaxNode.newOperator(StsOperator.ADD));

            // const lvalueType = this.exprValueType;
            // if (lvalueType == StsValueType.STRING) {
            //     this.byteCode.pushAction(StsAction.PUSHS);
            // } else if (lvalueType == StsValueType.NUMBER) {
            //     this.byteCode.pushAction(StsAction.PUSH);
            // } else {
            //     this.abort("This type cannot +");
            // }

            this.readToken();
            this.readExpr(parentNode);

            // const rvalueType = this.exprValueType;
            // if (lvalueType == StsValueType.NUMBER && rvalueType == StsValueType.NUMBER) {
            //     this.byteCode.pushAction(StsAction.ADD);
            // } else if (lvalueType == StsValueType.STRING && rvalueType == StsValueType.STRING) {
            //     this.byteCode.pushAction(StsAction.ADDS);
            // } else {
            //     this.abort("These types cannot +");
            // }
        } else if (this.tokenIsChar("-")) {
            // '-' -> '-' [expression]
            parentNode.pushChild(StsSyntaxNode.newOperator(StsOperator.SUBTRACT));
            // if (this.exprValueType == StsValueType.NUMBER) {
            //     this.byteCode.pushAction(StsAction.PUSH);
            // } else {
            //     this.abort("This type cannot -");
            // }

            this.readToken();
            this.readExpr(parentNode);

            // if (this.exprValueType == StsValueType.NUMBER) {
            //     this.byteCode.pushAction(StsAction.SUB);
            // } else {
            //     this.abort("These types cannot -");
            // }
        } else if (this.tokenIsChar("*")) {
            // '*' -> '*' [expression]
            parentNode.pushChild(StsSyntaxNode.newOperator(StsOperator.MULTIPLY));

            // if (this.exprValueType == StsValueType.NUMBER) {
            //     this.byteCode.pushAction(StsAction.PUSH);
            // } else {
            //     this.abort("This type cannot *");
            // }

            this.readToken();
            this.readExpr(parentNode);

            // if (this.exprValueType == StsValueType.NUMBER) {
            //     this.byteCode.pushAction(StsAction.MUL);
            // } else {
            //     this.abort("These types cannot *");
            // }
        } else if (this.tokenIsChar("/")) {
            // '/' -> '/' [expression]
            parentNode.pushChild(StsSyntaxNode.newOperator(StsOperator.DIVIDE));

            // if (this.exprValueType == StsValueType.NUMBER) {
            //     this.byteCode.pushAction(StsAction.PUSH);
            // } else {
            //     this.abort("This type cannot /");
            // }

            this.readToken();
            this.readExpr(parentNode);

            // if (this.exprValueType == StsValueType.NUMBER) {
            //     this.byteCode.pushAction(StsAction.DIV);
            // } else {
            //     this.abort("These types cannot /");
            // }
        } else if (this.tokenIsChar("%")) {
            // '%' -> '%' [expression]
            parentNode.pushChild(StsSyntaxNode.newOperator(StsOperator.MOD));

            // if (this.exprValueType == StsValueType.NUMBER) {
            //     this.byteCode.pushAction(StsAction.PUSH);
            // } else {
            //     this.abort("This type cannot %");
            // }

            this.readToken();
            this.readExpr(parentNode);

            // if (this.exprValueType == StsValueType.NUMBER) {
            //     this.byteCode.pushAction(StsAction.MOD);
            // } else {
            //     this.abort("These types cannot %");
            // }
        } else {
            // null
        }
    }

    readParamList(parentNode) {
        let result = 0;

        if (
            this.tokenIsComposite(StsCompositeToken.INC) ||
            this.tokenIsComposite(StsCompositeToken.DEC) ||
            this.tokenType == TokenType.STRING_LITERAL ||
            this.tokenType == TokenType.NUMBER_LITERAL ||
            this.tokenIsKeyword(StsKeyword.TRUE) ||
            this.tokenIsKeyword(StsKeyword.FALSE) ||
            this.tokenType == TokenType.IDENTIFIER
        ) {
            // '++' | '--' | [string_literal] | [number_literal] | [true] | [false] | identifier -> expression
            this.readExpr(parentNode);
            ++result;
            // if (this.exprValueType == StsValueType.STRING) {
            //     this.byteCode.pushAction(StsAction.PUSHS);
            // }

            // 读取 parameter_list_left
            if (this.tokenIsChar(",")) {
                // ',' -> ','[parameter_list]
                this.readToken();
                result += this.readParamList(parentNode);
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

    /**
     * 
     * @param {StsSyntaxNode} root 
     */
    writeByteCode(root) {
        const nodeType = root.type;
        if (nodeType == StsSyntaxNodeType.PROGRAM) {
            // 读取 statement
            for (const child of root.children) {
                const childType = child.type;
                if (childType == StsSyntaxNodeType.EXPRESSION_STATEMENT) {
                    // expressionStatement
                    const exprNode = child.children[0];
                    this.writeExpression(exprNode);
                } else if (childType == StsSyntaxNodeType.LET_STATEMENT) {
                    // letStatement
                    const idenNode = child.children[1];
                    const varName = idenNode.identifierName;
                    if (this.symbolMap.has(varName)) {
                        // 变量名已用
                        this.semanticError("Identifier name is already used", varName);
                    }

                    let valueType = StsValueType.ANY;
                    let initialized = false;
                    // 读取可能存在的类型定义和初始化式
                    if (child.children.length >= 3) {
                        const node_2 = child.children[2];
                        if (node_2.type == StsSyntaxNodeType.TYPE_DESCRIPTION) {
                            // 类型定义
                            const typeKeywordNode = node_2.children[0];
                            if (typeKeywordNode.keyword == StsKeyword.STRING) {
                                valueType = StsValueType.STRING;
                            } else if (typeKeywordNode.keyword == StsKeyword.NUMBER) {
                                valueType = StsValueType.NUMBER;
                            } else if (typeKeywordNode.keyword == StsKeyword.BOOLEAN) {
                                valueType = StsValueType.BOOLEAN;
                            } else if (typeKeywordNode.keyword == StsKeyword.UNDEFINED) {
                                valueType = StsValueType.UNDEFINED;
                            } else if (typeKeywordNode.keyword == StsKeyword.ANY) {
                                valueType = StsValueType.ANY;
                            } else {
                                this.semanticError("Invalid type description");
                            }
                        } else if (node_2.type == StsSyntaxNodeType.EXPRESSION) {
                            // 初始化式
                            this.writeExpression(node_2);
                            initialized = true;
                        }
                    }
                    const address = this.nextAddress();
                    this.symbolMap.set(varName, StsSymbol.newVariable(valueType, address));

                    if (initialized) {
                        // 生成初始化代码
                        if (this.exprValueType != valueType) {
                            this.semanticError("Type dismatch");
                        }
                        if (valueType == StsValueType.STRING) {
                            this.byteCode.pushAction(StsAction.STORES);
                        } else if (valueType == StsValueType.NUMBER) {
                            this.byteCode.pushAction(StsAction.STORE);
                        } else if (valueType == StsValueType.BOOLEAN) {
                            this.byteCode.pushAction(StsAction.STORE);
                        } else if (valueType == StsValueType.UNDEFINED) {
                            this.byteCode.pushAction(StsAction.STORE);
                        }
                    }
                } else if (childType == StsSyntaxNodeType.STATEMENT_BLOCK) {
                    this.writeStatementBlock(child);
                }
            }
        }
        switch (top.type) {
            case StsSyntaxNodeType.PROGRAM:
            case StsSyntaxNodeType.STATEMENT_BLOCK:
            case StsSyntaxNodeType.EXPRESSION_STATEMENT:
            case StsSyntaxNodeType.EXPRESSION:
            case StsSyntaxNodeType.LET_STATEMENT:
            case StsSyntaxNodeType.TYPE_DESCRIPTION:
                const children = top.children;
                for (let i = children.length - 1; i != -1; --i) {
                    nodeStack.push(children[i]);
                }
                break;
        }
    }

    /**
     * 
     * @param {StsSyntaxNode} node 
     */
    writeExpression(node) {
        for (const child of node.children) {
            const childType = child.type;
            if (childType == StsSyntaxNodeType.STRING_LITERAL) {
                const stringLiteral = child.stringLiteral;

                this.exprValueType = StsValueType.STRING;
                this.operandValueTypeStack.push(StsValueType.STRING);

                this.byteCode.pushAction(StsAction.MOVS);
                this.byteCode.pushStringCode(stringLiteral);
            } else if (childType == StsSyntaxNodeType.NUMBER_LITERAL) {
                const numberLiteral = child.numberLiteral;

                this.exprValueType = StsValueType.NUMBER;
                this.operandValueTypeStack.push(StsValueType.NUMBER);

                this.byteCode.pushAction(StsAction.MOV);
                this.byteCode.pushNumberCode(numberLiteral);
            } else if (childType == StsSyntaxNodeType.KEYWORD && child.keyword == StsKeyword.TRUE) {
                this.exprValueType = StsValueType.BOOLEAN;
                this.operandValueTypeStack.push(StsValueType.BOOLEAN);

                this.byteCode.pushAction(StsAction.MOV);
                this.byteCode.pushNumberCode(1);
            } else if (childType == StsSyntaxNodeType.KEYWORD && child.keyword == StsKeyword.FALSE) {
                this.exprValueType = StsValueType.BOOLEAN;
                this.operandValueTypeStack.push(StsValueType.BOOLEAN);
                
                this.byteCode.pushAction(StsAction.MOV);
                this.byteCode.pushNumberCode(0);
            } else if (childType == StsSyntaxNodeType.IDENTIFIER) {
                const idenName = child.identifierName;
                if (!this.symbolMap.has(idenName)) {
                    this.semanticError("Unknown identifier", child);
                }
                const symbol = this.symbolMap.get(idenName);
                if (symbol.type != SymbolType.VARIABLE) {
                    this.semanticError("Expect variable", child);
                }

                const valueType = symbol.valueType;
                const address = symbol.address;

                this.exprValueType = valueType;
                this.operandValueTypeStack.push(valueType);

                if (valueType == StsValueType.STRING) {
                    this.byteCode.pushAction(StsAction.LOADS);
                } else if (
                    valueType == StsValueType.NUMBER ||
                    valueType == StsValueType.BOOLEAN ||
                    valueType == StsValueType.UNDEFINED
                ) {
                    this.byteCode.pushAction(StsAction.LOAD);
                }
                this.byteCode.pushNumberCode(address);
            } else if (childType == StsSyntaxNodeType.OPERATOR) {
                const operator = child.operator;
                if (operator == StsOperator.ADD) {
                    this.byteCode.pushAction(StsAction.ADD);
                } else if (operator == StsOperator.SUBTRACT) {
                    this.byteCode.pushAction(StsAction.SUB);
                } else if (operator == StsOperator.MULTIPLY) {
                    this.byteCode.pushAction(StsAction.MUL);
                } else if (operator == StsOperator.DIVIDE) {
                    this.byteCode.pushAction(StsAction.DIV);
                } else if (operator == StsOperator.MOD) {
                    this.byteCode.pushAction(StsAction.MOD);
                } else if (operator == StsOperator.LEFT_INCREASE) {
                    this.byteCode.pushAction(StsAction.INC);
                } else if (operator == StsOperator.LEFT_DECREASE) {
                    this.byteCode.pushAction(StsAction.DEC);
                } else if (operator == StsOperator.RIGHT_INCREASE) {
                    this.byteCode.pushAction(StsAction.INC);
                } else if (operator == StsOperator.RIGHT_DECREASE) {
                    this.byteCode.pushAction(StsAction.DEC);
                } else if (operator == StsOperator.LEFT_FUN_CALL) {
                    this.byteCode.pushAction(StsAction.PUSH);
                } else if (operator == StsOperator.RIGHT_FUN_CALL) {
                    this.byteCode.pushAction(StsAction.CALLC);
                }
            }
        }
    }

    writeStatementBlock(node) {

    }

    /**
     * 
     * @param {StsOperator} opr 
     */
    pushOperator(opr) {
        let top;

        while (!opr.strongerThan(top = this.operatorStack[this.operatorStack.length - 1])) {
            this.operatorStack.pop();

            
        }

        if (this.exprValueType == StsValueType.STRING) {
            this.byteCode.pushAction(StsAction.PUSHS);
        } else if (
            this.exprValueType == StsValueType.NUMBER ||
            this.exprValueType == StsValueType.BOOLEAN ||
            this.exprValueType == StsValueType.UNDEFINED
        ) {
            this.byteCode.pushAction(StsAction.PUSH);
        }

        this.operatorStack.push(opr);
    }

    stringifyToken() {
        if (this.tokenType == TokenType.CHAR) {
            return this.charValue;
        } else if (this.tokenType == TokenType.IDENTIFIER) {
            return this.identifierName;
        } else if (this.tokenType == TokenType.STRING_LITERAL) {
            return `"${this.stringLiteral}"`;
        } else if (this.tokenType == TokenType.NUMBER_LITERAL) {
            return this.numberLiteral;
        } else if (this.tokenType == TokenType.COMPOSITE) {
            return this.compositeType;
        }
    }

    abort(err) {
        throw `${err}\n行: ${this.lineIndex + 1}`;
    }

    semanticError(err, node) {
        throw err;
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

        for (let i = 0; i < this.data.length;) {
            let unit = this.data[i];

            result += StsByteCode.stringifyAction(unit.code);
            ++i;
            for (; i < this.data.length;) {
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
                } else if (unit.type == StsByteCodeType.CFUN) {
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
            type: StsByteCodeType.CFUN,
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
StsByteCode.actionNameMap[StsAction.STORE] = "store";
StsByteCode.actionNameMap[StsAction.STORES] = "stores";
StsByteCode.actionNameMap[StsAction.LOAD] = "load";
StsByteCode.actionNameMap[StsAction.LOADS] = "loads";
StsByteCode.actionNameMap[StsAction.INC] = "inc";
StsByteCode.actionNameMap[StsAction.DEC] = "dec";
StsByteCode.actionNameMap[StsAction.ADD] = "add";
StsByteCode.actionNameMap[StsAction.ADDS] = "adds";
StsByteCode.actionNameMap[StsAction.SUB] = "sub";
StsByteCode.actionNameMap[StsAction.MUL] = "mul";
StsByteCode.actionNameMap[StsAction.DIV] = "div";
StsByteCode.actionNameMap[StsAction.MOD] = "mod";

StsByteCode.funcNameMap[StsFunc.GET_STRING] = "get_string";
StsByteCode.funcNameMap[StsFunc.SHOW_MESSAGE] = "show_message";

class StsSymbol {
    constructor() {
        this.type = SymbolType.VARIABLE;

        // type = variable
        this.valueType = StsValueType.UNDEFINED;
        // type = variable valueType = func
        this.code = StsFunc.GET_STRING;
        /**
         * @type {StsParameter[]}
         */
        this.paramArr = [];
        this.returnType = StsValueType.UNDEFINED;
        // type = variable valueType = string...
        this.address = 0;

        // type = keyword
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
        result.valueType = StsValueType.CFUN;
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

const StsSyntaxNodeType = {
    PROGRAM: 0,
    STATEMENT_BLOCK: 0,
    EXPRESSION_STATEMENT: 0,
    EXPRESSION: 0,
    LET_STATEMENT: 0,
    STRING_LITERAL: 0,
    NUMBER_LITERAL: 0,
    KEYWORD: 0,
    OPERATOR: 0,
    IDENTIFIER: 0,
    TYPE_DESCRIPTION: 0,

    nameMap: [],
    stringify(type) {
        return this.nameMap[type];
    }
};
initEnum(StsSyntaxNodeType);
addEnumOption(StsSyntaxNodeType, "PROGRAM");
addEnumOption(StsSyntaxNodeType, "STATEMENT_BLOCK");
addEnumOption(StsSyntaxNodeType, "EXPRESSION_STATEMENT");
addEnumOption(StsSyntaxNodeType, "EXPRESSION");
addEnumOption(StsSyntaxNodeType, "LET_STATEMENT");
addEnumOption(StsSyntaxNodeType, "STRING_LITERAL");
addEnumOption(StsSyntaxNodeType, "NUMBER_LITERAL");
addEnumOption(StsSyntaxNodeType, "KEYWORD");
addEnumOption(StsSyntaxNodeType, "OPERATOR");
addEnumOption(StsSyntaxNodeType, "IDENTIFIER");
addEnumOption(StsSyntaxNodeType, "TYPE_DESCRIPTION");
StsSyntaxNodeType.nameMap[StsSyntaxNodeType.PROGRAM] = "program";
StsSyntaxNodeType.nameMap[StsSyntaxNodeType.STATEMENT_BLOCK] = "statementBlock";
StsSyntaxNodeType.nameMap[StsSyntaxNodeType.EXPRESSION_STATEMENT] = "expressionStatement";
StsSyntaxNodeType.nameMap[StsSyntaxNodeType.EXPRESSION] = "expression";
StsSyntaxNodeType.nameMap[StsSyntaxNodeType.LET_STATEMENT] = "letStatement";
StsSyntaxNodeType.nameMap[StsSyntaxNodeType.STRING_LITERAL] = "stringLiteral";
StsSyntaxNodeType.nameMap[StsSyntaxNodeType.NUMBER_LITERAL] = "numberLiteral";
StsSyntaxNodeType.nameMap[StsSyntaxNodeType.KEYWORD] = "keyword";
StsSyntaxNodeType.nameMap[StsSyntaxNodeType.OPERATOR] = "operator";
StsSyntaxNodeType.nameMap[StsSyntaxNodeType.IDENTIFIER] = "identifier";
StsSyntaxNodeType.nameMap[StsSyntaxNodeType.TYPE_DESCRIPTION] = "typeDescription";

class StsSyntaxNode {
    constructor() {
        this.type = StsSyntaxNodeType.PROGRAM;
        /**
         * @type {StsSyntaxNode[]}
         */
        this.children = [];

        this.stringLiteral = "";
        this.numberLiteral = 0;
        this.keyword = "";
        this.operator = StsOperator.LEFT_FUN_CALL;
        this.identifierName = "";
    }
    static newProgram() {
        return new this();
    }
    static newStatementBlock() {
        const result = new this();
        result.type = StsSyntaxNodeType.STATEMENT_BLOCK;
        return result;
    }
    static newExpressionStatement() {
        const result = new this();
        result.type = StsSyntaxNodeType.EXPRESSION_STATEMENT;
        return result;
    }
    static newExpression() {
        const result = new this();
        result.type = StsSyntaxNodeType.EXPRESSION;
        return result;
    }
    static newLetStatement() {
        const result = new this();
        result.type = StsSyntaxNodeType.LET_STATEMENT;
        return result;
    }
    static newStringLiteral(str) {
        const result = new this();
        result.type = StsSyntaxNodeType.STRING_LITERAL;
        result.stringLiteral = str;
        return result;
    }
    static newNumberLiteral(num) {
        const result = new this();
        result.type = StsSyntaxNodeType.NUMBER_LITERAL;
        result.numberLiteral = num;
        return result;
    }
    static newKeyword(keyword) {
        const result = new this();
        result.type = StsSyntaxNodeType.KEYWORD;
        result.keyword = keyword;
        return result;
    }
    static newOperator(opr) {
        const result = new this();
        result.type = StsSyntaxNodeType.OPERATOR;
        result.operator = opr;
        return result;
    }
    static newIdentifier(name) {
        const result = new this();
        result.type = StsSyntaxNodeType.IDENTIFIER;
        result.identifierName = name;
        return result;
    }
    static newTypeDescription() {
        const result = new this();
        result.type = StsSyntaxNodeType.TYPE_DESCRIPTION;
        return result;
    }

    pushChild(child) {
        this.children.push(child);
    }
    getChildren() {
        const result = [];
        for (const child of this.children) {
            result.push(child.getAndChildren());
        }
        return result;
    }
    getAndChildren() {
        switch (this.type) {
            case StsSyntaxNodeType.PROGRAM:
            case StsSyntaxNodeType.STATEMENT_LIST:
            case StsSyntaxNodeType.STATEMENT_BLOCK:
            case StsSyntaxNodeType.EXPRESSION_STATEMENT:
            case StsSyntaxNodeType.EXPRESSION:
            case StsSyntaxNodeType.LET_STATEMENT:
            case StsSyntaxNodeType.LOCATABLE:
            case StsSyntaxNodeType.TYPE_DESCRIPTION:
                return {
                    type: StsSyntaxNodeType.stringify(this.type),
                    children: this.getChildren()
                };
            case StsSyntaxNodeType.STRING_LITERAL:
                return {
                    type: StsSyntaxNodeType.stringify(this.type),
                    value: this.stringLiteral
                };
            case StsSyntaxNodeType.NUMBER_LITERAL:
                return {
                    type: StsSyntaxNodeType.stringify(this.type),
                    value: this.numberLiteral
                };
            case StsSyntaxNodeType.KEYWORD:
                return {
                    type: StsSyntaxNodeType.stringify(this.type),
                    keywordType: StsKeyword.stringify(this.keyword)
                };
            case StsSyntaxNodeType.OPERATOR:
                return {
                    type: StsSyntaxNodeType.stringify(this.type),
                    operatorType: this.operator.stringify()
                };
            case StsSyntaxNodeType.IDENTIFIER:
                return {
                    type: StsSyntaxNodeType.stringify(this.type),
                    name: this.identifierName
                };
        }
    }
}

class StsParameter {
    constructor(valueType) {
        this.valueType = valueType;
    }
}

class StsOperator {
    static nameMap = new Map();

    constructor(precedence, leftAsso) {
        this.precedence = precedence;
        this.leftAsso = leftAsso;
    }
    /**
     * 
     * @param {StsOperator} other 
     * @returns 
     */
    strongerThan(other) {
        if (this.precedence > other.precedence) {
            return true;
        }
        if (this.precedence == other.precedence) {
            return !this.leftAsso;
        }
        return false;
    }
    stringify() {
        return StsOperator.nameMap.get(this);
    }
}
StsOperator.LOWEST = new StsOperator(0, null);
StsOperator.LEFT_FUN_CALL = new StsOperator(18, true);
StsOperator.RIGHT_FUN_CALL = new StsOperator(18, true);
StsOperator.ADD = new StsOperator(12, true);
StsOperator.SUBTRACT = new StsOperator(12, true);
StsOperator.MULTIPLY = new StsOperator(13, true);
StsOperator.DIVIDE = new StsOperator(13, true);
StsOperator.MOD = new StsOperator(13, true);
StsOperator.LEFT_INCREASE = new StsOperator(15, false);
StsOperator.LEFT_DECREASE = new StsOperator(15, false);
StsOperator.RIGHT_INCREASE = new StsOperator(16, null);
StsOperator.RIGHT_DECREASE = new StsOperator(16, null);
StsOperator.nameMap.set(StsOperator.LEFT_FUN_CALL, "(");
StsOperator.nameMap.set(StsOperator.RIGHT_FUN_CALL, ")");
StsOperator.nameMap.set(StsOperator.ADD, "+");
StsOperator.nameMap.set(StsOperator.SUBTRACT, "-");
StsOperator.nameMap.set(StsOperator.MULTIPLY, "*");
StsOperator.nameMap.set(StsOperator.DIVIDE, "/");
StsOperator.nameMap.set(StsOperator.MOD, "%");
StsOperator.nameMap.set(StsOperator.LEFT_INCREASE, "++");
StsOperator.nameMap.set(StsOperator.LEFT_DECREASE, "--");
StsOperator.nameMap.set(StsOperator.RIGHT_INCREASE, "++");
StsOperator.nameMap.set(StsOperator.RIGHT_DECREASE, "--");

function initEnum(obj) {
    obj.next = 0;
}

function addEnumOption(obj, name) {
    obj[name] = obj.next;
    ++obj.next;
}

const request = new XMLHttpRequest();
request.open("GET", "source.ts", false);
request.send(null);

const compiler = new StsCompiler();
const result = compiler.compileToByteCode(request.responseText);

console.log(result.stringify());