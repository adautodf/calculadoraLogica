/*
 * Funcionalidade principal da ferramenta de lógica proposicional
 */
 
/* Function: go
 *
 * Executa a pilha completa!
 */
function go() {
	var input = document.getElementById("expressionInput").value;
	try {		
		prettyPrintTruthTable(parse(input));
	} catch (e) {		  
		if (e.description !== undefined) {
			displayCompileError(input, e);
		} else {
			throw e;
		}
	}
}

/* Function: assert
 *
 * Afirma que a afirmação dada é verdadeira. Caso não seja, se lança uma exceção.
 */
function assert(expr, what) {
	if (expr === false) {
		throw new Error("A afirmação falhou: " + what);
	}
}

/* Function: unreachable
 *
 * Aciona uma falha e comunica o erro.
 */
function unreachable(why) {
	throw new Error("Código inacessível: " + why);
}