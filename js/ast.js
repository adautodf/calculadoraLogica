/*
 * Tipos que representam nós AST (Abstract	Syntax	Tree) árvore de sintaxe abstrata.

   Uma árvore de sintaxe abstrata representa todos os elementos sintáticos de uma linguagem
   de programação, semelhante às árvores de sintaxe que os linguistas usam para linguagens
   humanas. A árvore foca nas regras e não em elementos como chaves ou ponto-e-vírgula que
   encerram as declarações em alguns idiomas. A árvore é hierárquica, com os elementos das
   instruções de programação divididos em suas partes. Por exemplo, uma árvore para uma instrução
   condicional possui as regras para variáveis ​​suspensas no operador necessário.

   ASTs são amplamente utilizados em compiladores para verificar a precisão do código. Se a árvore
   gerada contiver erros, o compilador imprimirá uma mensagem de erro. ASTs são usados ​​porque algumas
   construções não podem ser representadas em uma gramática livre de contexto, como digitação implícita.
   ASTs são altamente específicos para linguagens de programação, mas a pesquisa está em andamento em
   árvores de sintaxe universal.
 */

/* Todos os nós AST devem possuir funções do tipo:
 *
 *   avaliar(atribuição), que devolve o valor da expressão dada. como uma matriz
 * 						  de verdadeiros e falsos.
 *   toString(variáveis), que produz uma representação legível por humanos da AST enraizada no nó
 *                        com a informação das variáveis. A expressão deve ter parênteses adicionados
 *                        conforme apropriado.
 */

/*** Tipo de nó para T ***/
function trueNode() {}

trueNode.prototype.evaluate = function(assignment) {
	return true;
}
trueNode.prototype.toString = function(variables) {
	return "&#8868;";
}


/*** Tipo de nó para F. ***/
function falseNode() {}

falseNode.prototype.evaluate = function(assignment) {
	return false;
}
falseNode.prototype.toString = function(variables) {
	return "&#8869;";
}

/*** Tipo de nó para ~. ***/
function negateNode(underlying) {
	this.underlying = underlying;
}

/* Para avaliar ~, avaliamos a expressão subjacente e negamos o resultado. */
negateNode.prototype.evaluate = function(assignment) {
	return !this.underlying.evaluate(assignment);
}
negateNode.prototype.toString = function(variables) {
	return "&not;" + this.underlying.toString(variables);
}

/*** Tipo de nó para /\ ***/
function andNode(lhs, rhs) {
	this.lhs = lhs;
	this.rhs = rhs;
}

andNode.prototype.evaluate = function(assignment) {
	return this.lhs.evaluate(assignment) && this.rhs.evaluate(assignment);
}
andNode.prototype.toString = function(variables) {
	return "(" + this.lhs.toString(variables) + " &and; " + this.rhs.toString(variables) + ")";
}

/*** Tipo de nó para \/ ***/
function orNode(lhs, rhs) {
	this.lhs = lhs;
	this.rhs = rhs;
}

orNode.prototype.evaluate = function(assignment) {
	return this.lhs.evaluate(assignment) || this.rhs.evaluate(assignment);
}
orNode.prototype.toString = function(variables) {
	return "(" + this.lhs.toString(variables) + " &or; " + this.rhs.toString(variables) + ")";
}

/*** Tipo de nó para -> ***/
function impliesNode(lhs, rhs) {
	this.lhs = lhs;
	this.rhs = rhs;
}

/* Utiliza o equivalente p -> q   ===   ~p \/ q */
impliesNode.prototype.evaluate = function(assignment) {
	return !this.lhs.evaluate(assignment) || this.rhs.evaluate(assignment);
}
impliesNode.prototype.toString = function(variables) {
	return "(" + this.lhs.toString(variables) + " &rarr; " + this.rhs.toString(variables) + ")";
}


/*** Tipo de nó para <-> ***/
function iffNode(lhs, rhs) {
	this.lhs = lhs;
	this.rhs = rhs;
}

iffNode.prototype.evaluate = function(assignment) {
	return this.lhs.evaluate(assignment) === this.rhs.evaluate(assignment);
}
iffNode.prototype.toString = function(variables) {
	return "(" + this.lhs.toString(variables) + " &harr; " + this.rhs.toString(variables) + ")";
}



/*** Tipo de nó para variáveis ***/
function variableNode(index) {
	this.index = index;
}

/* O valor de uma variável é dado tomando o valor dado a essa variável na atribuição explícita.
 */
variableNode.prototype.evaluate = function(assignment) {
	return assignment[this.index];
}
variableNode.prototype.toString = function(variables) {
	return variables[this.index];
}