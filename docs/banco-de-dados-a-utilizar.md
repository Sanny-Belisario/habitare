# Banco de dados que será utilizado

Para a conexão com o banco de dados, serão utilizados dois, o **SQLite** e **Postgres**.

O **SQLite** será para salvar os dados em memória enquanto o **Postgres** será para o compartilhamento entre diferentes dispositivos.

A comunicação com o banco de dados será feita com o **Drizzle-ORM**, onde ele gerenciará ambos os bancos de dados.
