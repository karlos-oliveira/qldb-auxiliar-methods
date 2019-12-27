# qldb-auxiliar-methods

This is not a functional npm pack yet, but if you desperately need a parser to deal with amazon QLDB formats, 
you can use /lib/index.js file. There you'll find all methods that is necessary to send commands with Json parameters,
get QLDBResult return and turn it on Json Format and another auxiliary methods.

IMPORTANT:

For now, to this "lib" works, you need to put your amazon credentials on .env file only AWS_REGION and AWS_SECRET_ACCESS_KEY are obrigatory

PS: This files have to be improved, so use at your own risk

---------------------------------------------------------------

Esse ainda não é um pacote npm funcional, mas se você precisar desesperadamente de um parser para lidar com os estranhos formatos QLDB da amazon,
você pode usar o arquivo /lib/index.js. Nele você encontrará todos os métodos necessários para enviar comandos com parâmetros Json,
retornar QLDBResult transformá-lo em Json e outros métodos auxiliares.

IMPORTANTE:

Por enquanto, para essa "lib" funcionar, você precisa colocar suas credenciais da amazon no arquivo .env. 

Somente AWS_REGION e AWS_SECRET_ACCESS_KEY são obrigatórias.

PS: Esses arquivos precisam ser melhorados, fiz para um rápido projeto de estudo, portanto, use por conta e risco