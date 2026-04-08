# Arquitetura do Sistema

O sistema será dividido em quatro camadas principais:

## 1. Camada de Sensoriamento

- Sensor de oxirredução (Nível da maré)
- Microcontrolador (ESP32 ou Arduino)

## 2. Camada de Comunicação

- Protocolo Wi-Fi
- Envio de dados via API REST

## 3. Camada de Processamento

- Backend em Node.js ou Python
- Processamento e validação dos dados
- Armazenamento em banco de dados

## 4. Camada de Visualização

- Dashboard web
- Gráficos em tempo real
- Histórico de medições

## Fluxo de Dados

Sensor → Microcontrolador → API → Banco de Dados → Dashboard
