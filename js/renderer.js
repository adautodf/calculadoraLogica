/*
 * Lógica para apresentar resultados e informações ao utilizador.
 */

/* Function: prettyPrintTruthTable
 *
 * Produz uma tabela verdade elegantemente formatada para a expressão analisada dada.
 */
function prettyPrintTruthTable(parseResult) {
	var table = createTableElement();
	
	/* Criar o cabeçalho, que precisa de conhecer as variáveis e a expressão. */
	createTableHeader(table, parseResult);
	
	/* Agora, vá gerar o corpo da tabela. */
	generateTruthTable(parseResult, outputRow(table));
	
	/* Visualizar o quadro. */
	displayTable(table);
}

/* Function: createTableElement
 *
 * Cria um novo elemento de tabela e define as suas propriedades.
 */
function createTableElement() {
	var result = document.createElement("table");
	result.className = "truthTable";
	return result;
}

/* Function: createTableHeader
 *
 * Dada uma tabela que representa o resultado da tabela de verdade, cria o cabeçalho
 * para a tabela, listando as variáveis e a expressão em colunas separadas.
 */
function createTableHeader(table, parseResult) {
	var header = document.createElement("tr");
	header.className = "header";

	/* Adicione uma coluna para cada variável. */
	for (var i = 0; i < parseResult.variables.length; i++) {
		var cell = document.createElement("th");
		cell.className = "variable";
		cell.innerHTML = parseResult.variables[i];
		header.appendChild(cell);
	}
	
	/* Acrescentar uma coluna para a expressão global. */
	var lastCell = document.createElement("th");
	lastCell.className = "expression";
	lastCell.innerHTML = parseResult.ast.toString(parseResult.variables);
	header.appendChild(lastCell);

	table.appendChild(header);
} 
 
/* Function: outputRow
 *
 * Dada uma tabela para a qual enviar uma linha, cria uma chamada de retorno que envia uma linha para essa tabela.
 */
function outputRow(table) {
	return function(assignment, result) {
		var row = document.createElement("tr");
		
		/* Mostrar o valor de cada variável. */
		for (var i = 0; i < assignment.length; i++) {
			var cell = document.createElement("td");
			cell.innerHTML = (assignment[i]? "T" : "F");
			row.appendChild(cell);
		}
		
		/* Mostrar o valor da expressão. */
		var lastCell = document.createElement("td");
		lastCell.innerHTML = (result? "T" : "F");
		row.appendChild(lastCell);
		
		table.appendChild(row);
	}
}

/* Function: displayTable
 *
 * Apresenta a tabela de verdade especificada na janela.
 */
function displayTable(table) {
	/* Create a container div to hold the table. */
	var holder = document.createElement("div");
	holder.className = "truth-table-holder";
	holder.appendChild(table);
	
	showObject(holder);
}

/* Function: showObject
 *
 * Apresenta o objeto HTML especificado na caixa de saída.
 */
function showObject(object) {
	/* Encontrar a div para guardar o objeto. */
	var target = document.getElementById("table-target");
	
	/* Se já tiver objectos, remova-os. */
	while (target.children.length !== 0) {
		target.removeChild(target.children[0]);
	}
	
	/* Instalar o nosso objeto nesse local. */
	target.appendChild(object);
}

/* Function: displayCompileError
 *
 * Apresenta a mensagem de erro de compilação especificada. O primeiro parâmetro deve
 * ser a string real fornecida como entrada, e o segundo a mensagem de erro
 * que foi gerada.
 */
function displayCompileError(input, error) {
	/* Criar uma div para guardar o resultado. */
	var holder = document.createElement("div");
	
	/* Criar a div de topo, que mostra a entrada original. */
	holder.appendChild(createHighlightedErrorBox(input, error));
	holder.appendChild(createDescriptionBox(error));
	
	showObject(holder);
}

/* Function: createHighlightedErrorBox
 *
 * Dada a entrada de texto e a informação de erro reportada, cria um elemento HTML
 * destacando o erro fornecido.
 */
function createHighlightedErrorBox(input, error) {
	/* Crie uma div para alojar o resultado. */
	var box = document.createElement("div");
	box.className = "syntax-error-holder";
	
	/* Criar um intervalo de caracteres até ao erro real, mas não o incluindo. */
	var prefix = document.createElement("span");
	prefix.className = "syntax-okay";
	prefix.textContent = input.substring(0, error.start);
	
	/* Criar um intervalo dos caracteres que contêm o erro. */
	var problem = document.createElement("span");
	problem.className = "syntax-error";
	problem.textContent = input.substring(error.start, error.end);
	
	/* Criar um intervalo de caracteres que contenha tudo o que se segue ao erro. */
	var suffix = document.createElement("span");
	suffix.className = "syntax-okay";
	suffix.textContent = input.substring(error.end);
	
	box.appendChild(prefix);
	box.appendChild(problem);
	box.appendChild(suffix);
	return box;
}

/* Function: createDescriptionBox
 *
 * Dado um erro, cria uma caixa HTML que contém esse erro.
 */
function createDescriptionBox(error) {
	var box = document.createElement("div");
	box.className = "syntax-error-explanation";
	box.textContent = error.description;
	return box;
}