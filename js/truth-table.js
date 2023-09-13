/* Lógica para gerar e apresentar uma tabela de verdade para representações analisadas de
 * fórmulas de lógica proposicional.
 */
 
/* Function: generateTruthTable
 *
 * Dada uma representação analisada de uma fórmula PL, calcula todas as possíveis atribuições de variáveis
 * possíveis para essa fórmula, determina o valor da fórmula em cada uma
 * cada uma dessas atribuições, e chama a chamada de retorno especificada para relatar os resultados de
 * cada uma dessas atribuições.
 */
function generateTruthTable(parseResult, callback) {
	/* Criar uma nova matriz de valores de verdade que representará os valores de verdade
	 * de todas as variáveis. Inicialmente, estes valores serão todos falsos. Nós vamos
	 * trataremos isso como um contador binário para enumerar todas as atribuições de verdade possíveis.
	 */
	var assignment = [];
	for (var i = 0; i < parseResult.variables.length; i++) {
		assignment.push(false);
	}
	
	/* Avaliar a expressão com todos os valores de verdade possíveis. Lembre-se - mesmo
	 * se houver zero variáveis, ainda há a atribuição de verdade vazia!
	 */
	do {
		callback(assignment, parseResult.ast.evaluate(assignment));	
	} while (nextAssignment(assignment));
}

/* Function: nextAssignment
 *
 * Dada uma matriz que representa uma atribuição de verdade, gera a próxima atribuição de verdade
 * a partir dela, devolvendo verdadeiro se for encontrada uma e falso caso contrário.
 *
 * Esta implementação funciona simulando um contador binário para enumerar todos os
 * valores de verdade.
 */
function nextAssignment(assignment) {
	/* Caminhando da direita para a esquerda, procura um falso para tornar verdadeiro. */
	var flipIndex = assignment.length - 1;
	while (flipIndex >= 0 && assignment[flipIndex]) flipIndex--;
	
	/* Se não encontrarmos um índice para inverter, já tentámos todas as atribuições e estamos
	 * portanto, terminámos.
	 */
	if (flipIndex == -1) return false;
	
	/* Caso contrário, inverte este índice para verdadeiro e todos os valores seguintes para falso. */
	assignment[flipIndex] = true;

	for (var i = flipIndex + 1; i < assignment.length; i++) {
		assignment[i] = false;
	}
	
	return true;
}