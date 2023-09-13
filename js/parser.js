/*
 * Um analisador que produz um AST a partir de uma sequência de tokens.
 */
 
/* Function: parse
 *
 * Dada uma cadeia de entrada, analisa-a para produzir um AST e um mapa de variáveis.
 * Se for bem sucedido, o objeto devolvido terá estes campos:
 *
 *   ast:       Raiz do AST gerado.
 *   variáveis: Mapa de índices para variáveis.
 *
 * Em caso de falhas, esta função lançará uma exceção com estes campos:
 *
 *   descrição:    O que ocorreu mal?
 *   começo:       Índice inicial do erro de sintaxe.
 *   final:        Índice final do erro de sintaxe.
 */
function parse(input) {
	/* Analisa a entrada para obter os tokens e o mapa de variáveis. */
	var scanResult = scan(input);
	var tokens = scanResult.tokens;
	
	/* Utilizando o algoritmo de Pátio de Manobras de Edsger Dijkstra, para converter uma expressão
	   infix em uma expressão postfix. Construindo o AST à medida que avançamos. Isso significa que
	   precisamos rastrear os operadores e operando (onde a pilha de operandos também incluí parênteses)).
	 *
	 * O operador ~ é complicado por modificar algo que ainda não vimos.
	 * Para lidar com isso, colocamos na pilha de operandos. Sempre que lemos
	 * um operando, nós repetidamente retiramos as negações até que não restasse nenhuma.
	 */
	var operators   = [];
	var operands    = [];
	
	/* Podemos estar num de dois estados diferentes:
	 *
	 *  needOperand: Estamos a espera de algo, que em última análise, seja avaliado como uma expressão. Podendo ser:
	 * 			 	 T, F, uma variável, uma negação de algo ou um parênteses.
	 * !needOperand: Temos o operando, e agora, estamos a espera que lhe seja aplicado um operador.
	 * 				 Nós também podemos obter um parênteses fechado.
	 *
	 */
	var needOperand = true;
	
	/* Passe de tokens */
	for (var i in tokens) {
		var currToken = tokens[i];
		
		if (needOperand) {
			/* Se for um operando, empurra-o para a pilha de operandos. */
			if (isOperand(currToken)) {
				addOperand(wrapOperand(currToken), operands, operators);
				needOperand = false;
			}
			/* Se for um parêntesis ou uma negação, coloca-o na pilha de parêntesis. Estamos
			 * ainda à espera de um operando.
			 */
			else if (currToken.type === "(" || currToken.type === "~") {
				operators.push(currToken);
			}
			
			/* Também é possível que tenhamos atingido o fim da entrada. Isto é um erro,
			 * mas para sermos simpáticos, vamos dar uma condição de erro mais específica.
			 */
			else if (currToken.type === kScannerConstants.EOF) {
				/* Se a pilha de operadores estiver vazia, a entrada estava vazia. */
				if (operators.length === 0) {
					parseError("", 0, 0);
				}
								
				/* Se a pilha de operadores tiver um ( no topo, existe um parêntesis aberto não correspondido. */
				if (topOf(operators).type === "(") {
					parseError("Este parêntesis aberto não tem parêntesis fechado correspondente.",
					           topOf(operators).start, topOf(operators).end);
				}
				
				/* Caso contrário, trata-se de um operador sem operando. */
				parseError("Falta um operando a este operador.",
				           topOf(operators).start, topOf(operators).end);
			}
			/* Tudo o resto é um erro de análise. */
			else {
				parseError("Esperávamos aqui uma variável, uma constante ou um parêntesis aberto.",
				           currToken.start, currToken.end);
			}
		}
		/* Caso contrário, estamos à espera de um operador ou de um parêntesis fechado. */
		else {		
			/* Se se tratar de um operador, avaliar avidamente os operadores até que este
			 * tenha prioridade não inferior ao que vem antes dele. Como um truque/hack, nós
			 * tratamos EOF como um operador com prioridade mais baixa, então ao atingir EOF
			 * avaliamos tudo à força.
			 */
			if (isBinaryOperator(currToken) || currToken.type === kScannerConstants.EOF) {
				/* Enquanto houver operadores de maior prioridade no topo da pilha,
				 * avalia-os.
				 */
				while (true) {
					/* Se não houver mais operandos para avaliar, terminámos. */
					if (operators.length === 0) break;
					
					/* Se for um parêntesis aberto, devemos parar porque o operador
					 * está a ser colocado entre parênteses para mais tarde.
					 */
					if (topOf(operators).type === "(") break;
					
					/* Compara a prioridade do topo da pilha com a prioridade do operador
					 * atual. Paramos se o novo operador tiver prioridade maior ou
					 * igual ao operador atual para garantir o agrupamento mais à direita.
					 */
					if (priorityOf(topOf(operators)) <= priorityOf(currToken)) break;
				
					/* Caso contrário, avalia o operador no topo da pilha. */
					var operator = operators.pop();
					var rhs = operands.pop();
					var lhs = operands.pop();
					
					addOperand(createOperatorNode(lhs, operator, rhs), operands, operators);
				}
				
				/* Agora, empurre este operador para a pilha de operadores. */
				operators.push(currToken);
				
				/* Acabámos de ler o nosso operador, por isso agora estamos à espera de um operando. */
				needOperand = true;
				
				/* Nesta altura, se tivermos EOF, parar. */
				if (currToken.type === kScannerConstants.EOF) break;
			}
			
			/* Se este for um parêntesis fechado, retiramos operadores da pilha e
			 * avaliamo-los até chegarmos a um parêntesis aberto. Então ainda estamos
			 * à procura de um operador.
			 */
			else if (currToken.type === ")") {
				/* Continuar a colocar operadores até obter um parêntesis próximo. */
				while (true) {
					/* Se ficarmos sem operadores, temos um parêntesis incompatível. */
					if (operators.length === 0) {
						parseError("Este parêntesis fechado não corresponde a nenhum parêntesis aberto.", currToken.start, currToken.end);
					}
					var currOp = operators.pop();
				
					/* Se o topo da pilha for um parêntesis aberto, devemos ter o
					 * topo da pilha de operandos contendo nosso valor, então estamos prontos.
					 */
					if (currOp.type === "(") break;
					
					/* Caso contrário, se o topo da pilha for uma negação, temos um erro de sintaxe. */
					if (currOp.type === "~") {
						parseError("Nada é negado por este operador.", currOp.start, currOp.end);
					}
					
					/* Caso contrário, deve ser um operador. Avalie-o. */
					var rhs = operands.pop();
					var lhs = operands.pop();
					
					addOperand(createOperatorNode(lhs, currOp, rhs), operands, operators);
				}
				
				/* Neste ponto, o topo da pilha contém o operando produzido a partir da expressão entre parênteses
				 * mas não o expusemos a nenhuma negação. Portanto, nós vamos retirá-lo e
				 * e adicioná-lo de volta através de addOperand.
				 */
				var expr = operands.pop();
				addOperand(expr, operands, operators);
			}
			/* Tudo o resto é um erro. */
			else {
				parseError("Esperávamos aqui um parêntesis fechado ou um conectivo binário.",
				           currToken.start, currToken.end);
			}
		}
	}
	
	/* Agora analisamos a entrada com sucesso, mas pode haver lixo extra na
	 * da pilha para nos preocuparmos. Vamos tratar disso aqui.
	 */
	
	/* Estes são efetivamente afirmações de que o topo da pilha é EOF; eles
	 * nunca devem falhar a menos que haja um caso de erro que esquecemos de tratar
	 * acima.
	 */
	assert (operators.length !== 0, "Não há operadores na pilha de operadores (erro lógico no analisador?)");
	assert (operators.pop().type === kScannerConstants.EOF, "O topo da pilha não é EOF (erro lógico no analisador?)");
	
	/* A pilha de operadores deve agora estar vazia. */
	if (operators.length !== 0) {
		/* O topo deveria ser um parêntesis aberto, uma vez que EOF teria despejado
		 * qualquer outra coisa.
		 */
		var mismatchedOp = operators.pop();
		assert (mismatchedOp.type === "(", 
		        "De alguma forma, falhou um operador de factorização em EOF (erro lógico no analisador?)");
		        
		parseError("Não há parêntesis fechado correspondente para este parêntesis aberto.",
		           mismatchedOp.start, mismatchedOp.end);
	}
	
	/* Se estamos aqui, fizemos a análise com sucesso! O topo da pilha de operandos é a nossa
	 * AST raiz, e a informação da análise dá-nos o mapa de variáveis.
	 */
	return {
	   ast:       operands.pop(),
	   variables: scanResult.variables
	};
}

/* Function: addOperand
 *
 * Adiciona um novo operando à pilha de operandos, avaliando quaisquer negações que precisem ser
 * realizadas primeiro.
 */
function addOperand(node, operands, operators) {
	/* Continue a avaliar os operadores de negação até não restar nenhum. */
	while (operators.length > 0 && topOf(operators).type === "~") {
		operators.pop();
		node = new negateNode(node);
	}
	
	/* Nesta altura, já negámos o máximo possível. Adicione o novo nó AST
	 * à pilha de operandos.
	 */
	operands.push(node);
}

/* Function: isOperand
 *
 * Retorna se o token fornecido é um operando. Os operandos são T, F e variáveis.
 */
function isOperand(token) {
	return token.type === "T" ||
	       token.type === "F" ||
	       token.type === "variable";
}

/* Function: wrapOperand
 *
 * Dado um token de operando, devolve um nó AST que encapsula esse operando.
 */
function wrapOperand(token) {
	if (token.type === "T")	return new trueNode();
	if (token.type === "F") return new falseNode();
	if (token.type === "variable") return new variableNode(token.index);
	unreachable("Token " + token.type + " não é um operando");
}

/* Function: isBinaryOperator
 *
 *Dado um token, informa se o token é um operador binário.
 */
function isBinaryOperator(token) {
	return token.type === "<->" ||
	       token.type === "->"  ||
	       token.type === "/\\" ||
	       token.type === "\\/";
}

/* Function: priorityOf
 *
 * Devolve a prioridade do operador dado. Fazemos de conta que EOF é um operador
 * com prioridade mínima para garantir que quando EOF é visto, nós retiramos todos os
 * operadores restantes.
 */
function priorityOf(token) {
	if (token.type === kScannerConstants.EOF) return -1;
	if (token.type === "<->") return 0;
	if (token.type === "->")  return 1;
	if (token.type === "\\/") return 2;
	if (token.type === "/\\") return 3;
	unreachable("Nunca deve precisar da prioridade de " + token.type);
}

/* Function: createOperatorNode
 *
 * Dado o LHS e o RHS de uma expressão e o token que representa o operador,
 * cria um nó AST correspondente a esse operador.
 */
function createOperatorNode(lhs, token, rhs) {
	if (token.type === "<->") return new iffNode(lhs, rhs);
	if (token.type === "->")  return new impliesNode(lhs, rhs);
	if (token.type === "\\/") return new orNode(lhs, rhs);
	if (token.type === "/\\") return new andNode(lhs, rhs);
	unreachable("Nunca deve ser necessário criar um nó de operador a partir de " + token.type);
}

/* Function: topOf
 *
 * Devolve o último elemento de uma matriz.
 */
function topOf(array) {
	assert(array.length !== 0, "Não é possível obter o topo de uma matriz vazia.");
	return array[array.length - 1];
}

/* Function: parseError
 *
 * Desencadeia uma falha do analisador no intervalo de caracteres especificado.
 */
function parseError(why, start, end) {
	throw { "description": why,
	        "start":  start,
	        "end":    end };
}