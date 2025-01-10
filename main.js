import Chart from 'chart.js/auto';
import { electionData } from './src/data.js';

const CORRECT_PASSWORD = 'fabio2026oneary';
let currentData = [];
let sortAscending = false;
let searchTerm = '';

// Login handling
function handleLogin() {
  const password = document.getElementById('passwordInput').value;
  if (password === CORRECT_PASSWORD) {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
    document.getElementById('errorMessage').style.display = 'none';
    loadData();
  } else {
    document.getElementById('errorMessage').style.display = 'block';
  }
}

document.getElementById('loginButton').addEventListener('click', handleLogin);
document.getElementById('passwordInput').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    handleLogin();
  }
});

// Previous functions remain exactly the same
async function loadData() {
  currentData = electionData;
  initializeFilters();
  updateDashboard();
}

function initializeFilters() {
  const cities = [...new Set(currentData.map(item => item.Localidade))];
  const parties = [...new Set(currentData.map(item => item['Partido / Coligação'].split('/')[0].trim()))];
  
  const cityFilter = document.getElementById('cityFilter');
  const partyFilter = document.getElementById('partyFilter');
  
  cities.forEach(city => {
    const option = document.createElement('option');
    option.value = city;
    option.textContent = city;
    cityFilter.appendChild(option);
  });

  parties.forEach(party => {
    const option = document.createElement('option');
    option.value = party;
    option.textContent = party;
    partyFilter.appendChild(option);
  });
}

function filterData() {
  const cityFilter = document.getElementById('cityFilter').value;
  const partyFilter = document.getElementById('partyFilter').value;
  const situationFilter = document.getElementById('situationFilter').value;

  return currentData.filter(item => {
    const matchCity = !cityFilter || item.Localidade === cityFilter;
    const matchParty = !partyFilter || item['Partido / Coligação'].includes(partyFilter);
    const matchSituation = !situationFilter || item.Situação.includes(situationFilter);
    const matchSearch = !searchTerm || 
      item['Nome Urna'].toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.Candidato.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCity && matchParty && matchSituation && matchSearch;
  });
}

function calculateStats(filteredData) {
  const totalVotes = filteredData.reduce((sum, item) => sum + item.Votação, 0);

  const partyVotes = {};
  filteredData.forEach(item => {
    const party = item['Partido / Coligação'].split('/')[0].trim();
    partyVotes[party] = (partyVotes[party] || 0) + item.Votação;
  });

  const topParties = Object.entries(partyVotes)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([party]) => party)
    .join(', ');

  document.getElementById('totalVotes').textContent = totalVotes.toLocaleString();
  document.getElementById('topParties').textContent = topParties;
}

function updateVoteDistributionChart(filteredData) {
  const ctx = document.getElementById('voteDistribution');

  if (window.voteChart) {
    window.voteChart.destroy();
  }

  const cityVotes = {};
  filteredData.forEach(item => {
    if (!cityVotes[item.Localidade]) {
      cityVotes[item.Localidade] = [];
    }
    cityVotes[item.Localidade].push({
      label: item['Nome Urna'], // Adiciona o nome do candidato
      votes: item.Votação
    });
  });

  // Transforma dados para Chart.js
  const labels = filteredData.map(item => item['Nome Urna']);
  const datasets = Object.entries(cityVotes).map(([city, candidates]) => ({
    label: city,
    data: candidates.map(c => c.votes),
    backgroundColor: `hsla(${Math.random() * 360}, 70%, 50%, 0.6)`,
    tooltip: {
      callbacks: {
        label: (tooltipItem) => `${candidates[tooltipItem.dataIndex].label}: ${tooltipItem.raw}`
      }
    }
  }));

  window.voteChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels, // Mostra todos os nomes
      datasets
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => {
              const city = context.dataset.label;
              const candidateName = cityVotes[city][context.dataIndex]?.label;
              const votes = context.raw;
              return `${candidateName} (${city}): ${votes}`;
            }
          }
        },
        title: {
          display: true,
          text: 'Distribuição de Votos por Cidade'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Número de Votos'
          }
        }
      }
    }
  });
}


function updateTable(filteredData) {
  const tbody = document.querySelector('#dataTable tbody');
  tbody.innerHTML = '';

  const sortedData = [...filteredData].sort((a, b) => {
    return sortAscending ? a.Votação - b.Votação : b.Votação - a.Votação;
  });

  sortedData.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item['Nome Urna']}</td>
      <td>${item.Localidade}</td>
      <td>${item['Partido / Coligação']}</td>
      <td>${item.Votação.toLocaleString()}</td>
      <td class="${item.Situação === 'Eleito' ? 'winner' : ''}">${item.Situação}</td>
    `;
    tbody.appendChild(row);
  });
}

function updateDashboard() {
  const filteredData = filterData();
  calculateStats(filteredData);
  updateVoteDistributionChart(filteredData);
  updateTable(filteredData);
}

// Event Listeners
document.getElementById('cityFilter').addEventListener('change', updateDashboard);
document.getElementById('partyFilter').addEventListener('change', updateDashboard);
document.getElementById('situationFilter').addEventListener('change', updateDashboard);
document.getElementById('searchInput').addEventListener('input', (e) => {
  searchTerm = e.target.value;
  updateDashboard();
});

document.getElementById('sortVotes').addEventListener('click', () => {
  sortAscending = !sortAscending;
  document.getElementById('sortDirection').textContent = sortAscending ? '↑' : '↓';
  updateDashboard();
});
