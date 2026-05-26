// Constantes globais e definições de dados para o wiki do GPPD.

export const SITE_TITLE = 'GPPD';
export const SITE_TITLE_LONG = 'Grupo de Processamento Paralelo e Distribuído';
export const SITE_SUBTITLE = 'Grupo de Processamento Paralelo e Distribuído · UFRGS';
export const SITE_DESCRIPTION = 'O wiki do Grupo de Pesquisa em Programação Distribuída — Instituto de Informática, UFRGS.';
export const SITE_FOUNDED = 1996;
export const SITE_URL = 'https://www.inf.ufrgs.br/gppd/';

export interface LinhadePesquisa {
  id: string;
  nome: string;
  descricao: string;
}

export const LINHAS_DE_PESQUISA: LinhadePesquisa[] = [
  { id: 'hpc',    nome: 'Computação de Alto Desempenho', descricao: 'Algoritmos escaláveis, escalonamento e runtimes para sistemas de grande escala.' },
  { id: 'perf',   nome: 'Análise de Desempenho',         descricao: 'Rastreamento, visualização e modelagem de aplicações paralelas.' },
  { id: 'energia',nome: 'Computação Energeticamente Consciente', descricao: 'Gerenciamento de energia e temperatura em CPU/GPU e plataformas heterogêneas.' },
  { id: 'borda',  nome: 'Contínuo Borda-Nuvem',          descricao: 'Orquestração e posicionamento de cargas entre nuvem, névoa e borda.' },
  { id: 'ml-sys', nome: 'Sistemas de Aprendizado de Máquina', descricao: 'Treinamento paralelo, inferência e pipelines de dados para aprendizado profundo.' },
  { id: 'arq',    nome: 'Arquitetura de Computadores',   descricao: 'Arquiteturas heterogêneas e emergentes: GPU, ARM, RISC-V, aceleradores.' },
];

export const GRUPOS_MEMBROS = ['Docentes', 'Colaboradores', 'Estudantes', 'Egressos'] as const;
export type GrupoMembro = typeof GRUPOS_MEMBROS[number];

/**
 * Hierarchical order within each group.
 * Lower number = shown first. Matched top-to-bottom; first hit wins.
 */
export const CARGO_PRIORIDADE: [RegExp, number][] = [
  [/professor titular/i,  0],
  [/professor associado/i, 1],
  [/professor adjunto/i,  2],
  [/professor/i,          3],
  [/pós.?doutorando|pos.?doutorando|postdoc/i, 4],
  [/pesquisador/i,        5],
  [/doutorando|doutoranda/i, 6],
  [/mestrando|mestranda/i,   7],
  [/bolsista|iniciação|graduando|ic\b/i, 8],
];
