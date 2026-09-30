// Lista de locais do jogo e as profissões/papéis possíveis em cada um.
// Cada local precisa ter pelo menos (maxPlayers - 1) papéis únicos disponíveis.
const LOCATIONS = [
  {
    name: "Escola",
    roles: ["Diretor", "Professor", "Aluno", "Zelador", "Bibliotecário", "Merendeira", "Coordenador", "Secretário", "Aluno de Intercâmbio", "Pai Presente na Reunião"]
  },
  {
    name: "Hotel",
    roles: ["Recepcionista", "Hóspede", "Gerente", "Camareira", "Segurança", "Concierge", "Carregador de Bagagem", "Chef do Restaurante", "Manobrista", "Turista Perdido"]
  },
  {
    name: "Cassino",
    roles: ["Dealer", "Apostador", "Segurança", "Gerente", "Garçonete", "Sortudo da Noite", "Jogador Profissional", "Caça-níquel Viciado", "Vigilante das Câmeras", "Caixa"]
  },
  {
    name: "Hospital",
    roles: ["Médico", "Enfermeiro", "Paciente", "Cirurgião", "Recepcionista", "Anestesista", "Visitante", "Estagiário de Medicina", "Ambulante da Farmácia", "Diretor Clínico"]
  },
  {
    name: "Banco",
    roles: ["Gerente", "Caixa", "Segurança", "Cliente", "Assaltante Disfarçado", "Consultor Financeiro", "Estagiário", "Vigia Noturno", "Cobrador", "Auditor"]
  },
  {
    name: "Praia",
    roles: ["Salva-vidas", "Turista", "Vendedor de Coco", "Surfista", "Instrutor de Mergulho", "Fotógrafo", "Ambulante de Sorvete", "Pescador Local", "Barraqueiro", "Guarda do Parque"]
  },
  {
    name: "Avião",
    roles: ["Piloto", "Comissário de Bordo", "Passageiro", "Copiloto", "Passageiro Nervoso", "Passageiro de Primeira Classe", "Criança Viajando Só", "Mecânico de Bordo", "Passageiro Famoso", "Agente de Segurança"]
  },
  {
    name: "Submarino",
    roles: ["Capitão", "Engenheiro", "Marinheiro", "Cozinheiro", "Sonar Operador", "Médico de Bordo", "Imediato", "Torpedista", "Radiotelegrafista", "Recruta Novato"]
  },
  {
    name: "Circo",
    roles: ["Palhaço", "Domador de Leões", "Trapezista", "Mágico", "Vendedor de Pipoca", "Dono do Circo", "Malabarista", "Engolidor de Fogo", "Equilibrista", "Assistente do Mágico"]
  },
  {
    name: "Teatro",
    roles: ["Ator Principal", "Diretor de Palco", "Figurinista", "Iluminador", "Espectador", "Bilheteiro", "Maquiador", "Dublê", "Compositor", "Crítico de Teatro"]
  },
  {
    name: "Restaurante",
    roles: ["Chef", "Garçom", "Cliente", "Sommelier", "Lavador de Pratos", "Gerente", "Segurança", "Músico da Casa", "Confeiteiro", "Crítico Gastronômico"]
  },
  {
    name: "Supermercado",
    roles: ["Caixa", "Gerente", "Cliente", "Repositor", "Segurança", "Padeiro", "Açougueiro", "Promotor de Vendas", "Empacotador", "Fiscal de Preços"]
  },
  {
    name: "Estação Espacial",
    roles: ["Comandante", "Astronauta", "Engenheiro de Bordo", "Cientista", "Médico Espacial", "Piloto da Nave", "Técnico de Comunicação", "Especialista em Robótica", "Biólogo Espacial", "Visitante em Missão"]
  },
  {
    name: "Prisão",
    roles: ["Diretor", "Carcereiro", "Detento", "Advogado de Defesa", "Visitante", "Cozinheiro da Prisão", "Capelão", "Guarda Novo", "Psicólogo", "Detento Veterano"]
  },
  {
    name: "Parque de Diversões",
    roles: ["Operador de Brinquedo", "Visitante", "Vendedor de Algodão-doce", "Segurança", "Palhaço Animador", "Gerente do Parque", "Fotógrafo", "Técnico de Manutenção", "Mascote", "Criança Perdida"]
  },
  {
    name: "Navio de Cruzeiro",
    roles: ["Capitão", "Passageiro", "Garçom", "Animador de Bordo", "Médico do Navio", "Camareira", "Músico", "Comandante de Convés", "Chef Executivo", "Turista em Lua de Mel"]
  },
  {
    name: "Delegacia de Polícia",
    roles: ["Delegado", "Policial", "Detetive", "Suspeito", "Vítima", "Advogado", "Perito Criminal", "Estagiário", "Repórter", "Testemunha"]
  },
  {
    name: "Estúdio de TV",
    roles: ["Apresentador", "Cameraman", "Diretor de Programa", "Convidado Famoso", "Maquiador", "Produtor", "Iluminador", "Repórter", "Figurante", "Editor de Vídeo"]
  },
  {
    name: "Universidade",
    roles: ["Reitor", "Professor", "Estudante", "Bibliotecário", "Monitor", "Pesquisador", "Zelador", "Aluno de Pós-graduação", "Palestrante Visitante", "Coordenador de Curso"]
  },
  {
    name: "Igreja",
    roles: ["Padre", "Coroinha", "Fiel", "Coral", "Noivo", "Noiva", "Sacristão", "Organista", "Catequista", "Visitante Turista"]
  },
  {
    name: "Aeroporto",
    roles: ["Piloto", "Comissário de Bordo", "Passageiro", "Agente de Check-in", "Segurança", "Despachante de Bagagem", "Controlador de Voo", "Turista Atrasado", "Funcionário da Loja Duty-Free", "Imigração"]
  },
  {
    name: "Spa",
    roles: ["Massagista", "Cliente", "Recepcionista", "Esteticista", "Instrutor de Yoga", "Gerente", "Manicure", "Terapeuta", "Cliente Vip", "Estagiária"]
  },
  {
    name: "Mina",
    roles: ["Engenheiro de Minas", "Minerador", "Geólogo", "Operador de Máquina", "Segurança", "Capataz", "Motorista de Caminhão", "Resgatista", "Inspetor de Segurança", "Novato"]
  },
  {
    name: "Zoológico",
    roles: ["Veterinário", "Tratador de Animais", "Visitante", "Guia Turístico", "Vendedor de Sorvete", "Segurança", "Biólogo", "Fotógrafo", "Criança em Excursão", "Gerente do Zoológico"]
  }
];

module.exports = LOCATIONS;
