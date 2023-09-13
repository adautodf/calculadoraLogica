/*
 * Um scanner para converter expressões de texto num token de lógica proposicional
 * Fluxo e variável associada <-> mapa de índice.
 *
 * Os tokens podem ser qualquer um destes operadores:
 *
 *    /\   \/  ->  <->  ~
 *
 * Podem também ser os símbolos especiais T e F, parênteses, variáveis ou um
 * marcador especial de EOF.
 */

kScannerConstants = {
	EOF: "$"						// Marcador EOF colocado internamente na cadeia
}
 
/* Function: scan(input)
 *
 * Analisa a cadeia de entrada e produz um objeto com dois campos:
 *
 * tokens:    Uma lista dos tokens na entrada, em ordem.
 * variáveis: Uma lista das variáveis, codificadas pelo seu índice. Veja abaixo.
 *
 * Para simplificar, cada variável é substituída por um código numérico baseado no seu
 * índice alfabético. Por exemplo, se as variáveis são p, q, e r, então
 * p obteria o valor 0, q obteria o valor 1 e r obteria o valor 2. A matriz
 * array "variables" seria então ["p", "q", "r"].
 *
 * O token final no fluxo será o token EOF, que o analisador pode então
 * usar conforme necessário.
 *
 * Se ocorrer um erro lexical, um objeto de erro é lançado. O erro conterá
 * esta informação:
 *
 * descrição: Uma descrição legível por humanos do erro.
 * Início:       O índice na string em que o erro começa (inclusive).
 * end:         O índice na string em que o erro termina (exclusivo).
 */
function scan(input) {
  /* Verificar se a entrada não contém quaisquer caracteres inválidos. */
  checkIntegrity(input);
  
  /* Obtém uma análise preliminar em que as variáveis são nomeadas em vez de
   * numeradas.
   */
  var preliminary = preliminaryScan(input);
  
  /* Converta a análise preliminar no resultado, ordenando as variáveis por
   * nome e renumerando-as.
   */
  return numberVariables(preliminary);
}

/* Function: preliminaryScan
 *
 * Efectua um exame preliminar da entrada. A verificação preliminar é idêntica à
 * a verificação final, exceto que as variáveis são nomeadas em vez de numeradas.
 * O objeto retornado terá dois campos:
 *
 * tokens:      Os tokens na entrada.
 * variableSet: Um dicionário de todos os tokens nomeados na entrada.
 */
function preliminaryScan(input) {
/* Acrescenta um marcador especial $ ao final da entrada. Isto servirá como nosso marcador
   * EOF e elimina uma série de casos especiais no tratamento do input.
   */
  input += kScannerConstants.EOF;
  
  /* Executa a verificação! */
  var i = 0;            // Índice na cadeia de caracteres
  var variableSet = {}; // Conjunto de variáveis em uso
  var tokens = [];      // Lista de tokens
  
  while (true) {
    var curr = input.charAt(i); // Carácter atual
    
    /* Parar no EOF se o encontrarmos. */
    if (curr === kScannerConstants.EOF) {
    	tokens.push(makeIdentityToken(curr, i));
    	return {
    	  "tokens": tokens,
    	  "variableSet" : variableSet
    	};
    }
    /* Se estivermos a ler uma variável, puxamos a variável inteira. */
    else if (isVariableStart(input, i)) {
    	/* Vamos fazer variáveis num processo de duas etapas. Primeiro, vamos
    	 * ler as variáveis e armazená-las por nome. Depois, vamos pós-processar
    	 * para substituir o nome de cada variável pelo seu índice.
    	 */
    	var variable = scanVariable(input, i, variableSet);
    	tokens.push(makeVariableToken(variable, i, i + variable.length));
    	
    	/*Saltar para além dos caracteres simbólicos. */
    	i += variable.length;
    }
    /* Se estivermos a ler um operador ou outra parte da sintaxe, puxamos o operador inteiro. */
    else if (isOperatorStart(input, i)) {
    	var token = tryReadOperator(input, i);
    	/* O token não deve ser nulo aqui. */
    	
    	tokens.push(makeIdentityToken(token, i));
    	
    	/* Saltar as personagens que acabámos de ler. */
    	i += token.length;
    }
    /* Se estivermos a ler espaços em branco, basta saltá-los. */
    else if (isWhitespace(input.charAt(i))) {
    	i++;
    }
    else {
    	scannerFail("O carácter " + input.charAt(i) + " não deveria estar aqui.", i, i + 1);
    }
  }
}

/* Function: makeIdentityToken
 *
 * Dada uma string que é seu próprio tipo de token, envolve essa string como um token para
 * o scanner.
 */
function makeIdentityToken(str, index) {
	return { type:  translate(str),
	         start: index,
	         end:   index + str.length };
}

/* Function: makeVariableToken
 *
 * Dado um índice de variável, cria um token que contém esse índice de variável.
 */
function makeVariableToken(varIndex, start, end) {
	return { type: "variable", 
	         index: varIndex,
	         "start": start,
	         "end": end };
}

/* Function: isVariableStart
 *
 * Dada a entrada a analisar e um desvio nessa entrada, determina se a
 * entrada que começa nessa entrada é o nome de uma variável.
 *
 * Os nomes das variáveis devem começar por uma letra ou um sublinhado, consistir em letras e
 * sublinhados, e não ser identicamente T ou F.
 */
function isVariableStart(input, index) {
	return tryReadVariableName(input, index) !== null;
}

/* Function: tryReadVariableName
 *
 * Tenta ler o nome de uma variável que começa no índice dado na cadeia.
 * Se um nome de variável puder ser lido, é devolvido. Se não, esta função retorna
 * null.
 */
function tryReadVariableName(input, index) {	
	/* Necessita de começar com uma letra ou um sublinhado. */
	if (!/[A-Za-z_]/.test(input.charAt(index))) return null;

	/* Continuar a ler personagens enquanto é possível. */	
	var result = "";
	while (/[A-Za-z_0-9]/.test(input.charAt(index))) {
		result += input.charAt(index);
		index++;	
	}
	
	/* Devolve o resultado desde que não seja uma palavra reservada. */
	return isReservedWord(result)? null : result;
}

/* Function: isReservedWord
 *
 * Devolve se o token especificado é uma palavra reservada.
 */
function isReservedWord(token) {
	return token === "T" || token === "F" || token === "and" || token === "or" ||
	       token === "not" || token === "iff" || token === "implies" ||
	       token === "true" || token === "false";
}

/* Function: scanVariable
 *
 * Dada a string a ser digitalizada, um deslocamento inicial e a lista de variáveis, digitaliza uma
 * do fluxo, adiciona-o ao conjunto de variáveis e retorna o
 * nome da variável.
 *
 * Assume-se que estamos de facto a olhar para uma variável, por isso não é feito qualquer tratamento de erros
 * é feito aqui.
 */
function scanVariable(input, index, variableSet) {
	var variableName = tryReadVariableName(input, index);
	/* variableName não deve ser nulo aqui, por contrato. */
	
	variableSet[variableName] = true;
	return variableName;
}

/* Function: isOperatorStart
 *
 * Dada a entrada a analisar e um índice inicial, devolve se existe um operador
 * na posição atual.
 */
function isOperatorStart(input, index) {
	return tryReadOperator(input, index) !== null;
}

/* Function: tryReadOperator
 *
 * Dada a entrada a analisar e um índice inicial, devolve o operador no índice atual
 * atual, se existir, e nulo, caso contrário.
 */
function tryReadOperator(input, index) {
  /* TODO: Limpar isto um pouco? Isto era ótimo quando tínhamos apenas alguns símbolos, mas
   * com a adição dos operadores LaTeX isto está a ficar um pouco complicado.
   */
   
  /* Procurar na ordem inversa do comprimento, de modo a utilizarmos o máximo de "mastigação". */
  /* Caso 1: Operadores de quinze caracteres. */
	if (index < input.length - 14) {
  	var fifteenChars = input.substring(index, index + 15);
  	if (fifteenChars === "\\leftrightarrow" || fifteenChars === "\\Leftrightarrow") {
  		return fifteenChars;
  	}
  }
	
  /* Caso 2: Operadores com onze caracteres. */
	if (index < input.length - 10) {
  	var elevenChars = input.substring(index, index + 11);
  	if (elevenChars === "\\rightarrow" || elevenChars === "\\Rightarrow") {
  		return elevenChars;
  	}
  }

  /* Caso 3: Operadores de sete caracteres como "implica" */
	if (index < input.length - 6) {
  	var sevenChars = input.substring(index, index + 7);
  	if (sevenChars === "implies") {
  		return sevenChars;
  	}
  }
	
	/* Caso 4: Operadores de seis caracteres */
	if (index < input.length - 5) {
  	var sixChars = input.substring(index, index + 6);
  	if (sixChars === "\\wedge") {
  		return sixChars;
  	}
  }
	
	/* Caso 5: Operadores de cinco caracteres como "false" */
	if (index < input.length - 4) {
  	var fiveChars = input.substring(index, index + 5);
  	if (fiveChars === "false"  || fiveChars === "\\lnot" ||
  	    fiveChars === "\\lneg" || fiveChars === "\\land") {
  		return fiveChars;
  	}
  }
	
	/* Caso 6: Operadores de quatro caracteres como "true" */
	if (index < input.length - 3) {
  	var fourChars = input.substring(index, index + 4);
  	if (fourChars === "true"  || fourChars === "\\top" ||
  	    fourChars === "\\bot" || fourChars === "\\lor" ||
  	    fourChars === "\\vee" || fourChars === "\\neg") {
  		return fourChars;
  	}
  }
	
	/* Caso 7: Operadores de três caracteres como <-> */
	if (index < input.length - 2) {
  	var threeChars = input.substring(index, index + 3);
  	if (threeChars === "<->" || threeChars === "and" ||
  	    threeChars === "<=>" || threeChars === "not" ||
  	    threeChars === "iff" || threeChars === "\\to") {
  		return threeChars;
  	}
  }
	
	/* Caso 8: Operador de dois caracteres como ->, /\, \/ */
	if (index < input.length - 1) {
  	var twoChars = input.substring(index, index + 2);
  	if (twoChars === "/\\" || twoChars === "\\/" || twoChars === "->" ||
  	    twoChars === "&&"  || twoChars === "||"  || twoChars === "or" ||
  	    twoChars === "=>") {
  		return twoChars;
  	}
  }
	
	/* Caso 9: Operador de um só carácter, como (, ), ~, T, F. */
	if (/[()~TF^!\u2227\u2228\u2192\u2194\u22A4\u22A5\u00AC]/.test(input.charAt(index))) {
		return input.charAt(index);
	}
	
	/* Se chegássemos aqui, nada combinava. */
	return null;
}

/* Function: translate
 *
 * Traduz um lexema para o seu tipo de token apropriado. Isto é usado, por exemplo, para mapear
 * & e | para /\ e \/.
 */
function translate(input) {
	if (input === "&&"  || input === "and" || input === "\u2227" || input === "\\land" || input === "\\wedge" || input === "^") return "/\\";
	if (input === "||"  || input === "or"  || input === "\u2228" || input === "\\lor" || input === "\\vee") return "\\/";
	if (input === "=>"  || input === "\u2192" || input === "implies" || input === "\\to" || input === "\\rightarrow" || input === "\\Rightarrow") return "->";
	if (input === "<=>" || input === "\u2194" || input === "iff" || input === "\\leftrightarrow" || input === "\\Leftrightarrow") return "<->";
	if (input === "not" || input === "!" || input === "\u00AC" || input === "\\lnot" || input === "\\neg") return "~";
	if (input === "\u22A4" || input === "true" || input === "\\top") return "T";
	if (input === "\u22A5" || input === "false" || input === "\\bot") return "F";
	return input;
}


/* Function: isWhitespace
 *
 * Devolve se o carácter dado é um espaço em branco.
 */
function isWhitespace(char) {
	return /\s/.test(char);
}

/* Function: scannerFail
 *
 * Desencadeia uma falha do scanner no intervalo de caracteres especificado.
 */
function scannerFail(why, start, end) {
	throw { "description": why,
	        "start":  start,
	        "end":    end };
}

/* Function: checkIntegrity
 *
 * Verifica a integridade da cadeia de entrada, procurando caracteres não permitidos.
 * Se algum caractere não permitido estiver presente, dispara um erro.
 */
function checkIntegrity(input) {
	var okayChars = /[A-Za-z_0-9\\\/<>\-~^()\s\&\|\=\!\u2227\u2228\u2192\u2194\u22A4\u22A5\u00AC]/;
	for (var i = 0; i < input.length; i++) {
		if (!okayChars.test(input.charAt(i))) {
			scannerFail("Illegal character", i, i + 1);
		}
	}
}

/* Function: numberVariables
 *
 * Dado o resultado de uma análise preliminar, ordena as variáveis e renumera-as
 * por ordem alfabética.
 *
 * O objeto devolvido tem dois campos:
 *
 *    tokens:    Os tokens da análise, com as variáveis numeradas.
 *    variables: Uma matriz que mapeia números para nomes de variáveis.
 */
function numberVariables(preliminary) {
	/* Adicionar todas as variáveis do dicionário a um array para podermos ordenar. */
	var variables = [];
	for (var key in preliminary.variableSet) {
		variables.push(key);
	}
	
	/* Ordenar as variáveis por ordem alfabética. */
	variables.sort();
	
	/* Inverter a matriz no conjunto de variáveis para pesquisas rápidas. */
	for (var i = 0; i < variables.length; i++) {
		preliminary.variableSet[variables[i]] = i;
	}
	
	/* Alterar o nome de cada variável para o seu índice. */
	for (var j = 0; j < preliminary.tokens.length; j++) {
		if (preliminary.tokens[j].type === "variable") {
			preliminary.tokens[j].index = preliminary.variableSet[preliminary.tokens[j].index];
		}
	}
	
	return {
		tokens: preliminary.tokens,
		"variables": variables
	};
}