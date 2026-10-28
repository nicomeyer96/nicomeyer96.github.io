type Project = {
  repo: string;
  title: string;
  description: string;
  links?: { label: string; url: string }[];
};

const catalog =
  "https://github.com/munich-quantum-software-stack/Component-Catalog/blob/3f555a2e5e7f030080676403784f6242f35f594c/_components/";

const projects: Project[] = [
  {
    repo: "qiskit-torch-module",
    title: "Qiskit-Torch-Module",
    description: "prototyping quantum neural networks with Qiskit and PyTorch",
    links: [
      { label: "PyPI", url: "https://pypi.org/project/qiskit-torch-module/" },
      { label: "MQSS catalog entry", url: `${catalog}qiskit-torch-module.md` },
    ],
  },
  {
    repo: "variational-lse-solver",
    title: "Variational LSE Solver",
    description: "variational quantum linear-system solvers",
    links: [
      { label: "PyPI", url: "https://pypi.org/project/variational-lse-solver/" },
      { label: "MQSS catalog entry", url: `${catalog}variational-lse-solver.md` },
    ],
  },
  {
    repo: "qrl-benchmark",
    title: "QRL Benchmark",
    description: "benchmarking quantum reinforcement learning",
    links: [{ label: "MQSS catalog entry", url: `${catalog}qrl-benchmark.md` }],
  },
  {
    repo: "vareftqc",
    title: "VarEFTQC",
    description: "learning logical operations for quantum error-correction codes",
    links: [{ label: "MQSS catalog entry", url: `${catalog}vareftqc.md` }],
  },
  {
    repo: "regularized-qpg",
    title: "Regularized QPG",
    description: "Lipschitz regularization for quantum policy gradients",
  },
  {
    repo: "varqec",
    title: "VarQEC",
    description: "variational quantum error correction via state distinguishability",
  },
  {
    repo: "learning-to-concatenate",
    title: "Learning to Concatenate",
    description: "learning to concatenate quantum codes",
  },
  {
    repo: "quantum-natural-policy-gradients",
    title: "Quantum Natural Policy Gradients",
    description: "sample-efficient quantum reinforcement learning",
  },
  {
    repo: "quantum-policy-gradients",
    title: "Quantum Policy Gradients",
    description: "quantum policy gradients with optimized action decoding",
  },
  {
    repo: "varqec-experiment",
    title: "VarQEC Experiment",
    description: "hardware experiment for variational quantum error correction",
  },
  {
    repo: "ws-varqpi",
    title: "WS-VarQPI",
    description: "warm-start variational quantum policy iteration",
  },
];

const destination = "software.qmd";
const page = await Deno.readTextFile(destination);
const startMarker = "<!-- software-list:start -->";
const endMarker = "<!-- software-list:end -->";
const start = page.indexOf(startMarker);
const end = page.indexOf(endMarker);
if (
  start < 0 || end < start ||
  page.indexOf(startMarker, start + 1) !== -1 ||
  page.indexOf(endMarker, end + 1) !== -1
) {
  throw new Error(`Expected one software list in ${destination}`);
}

const response = await fetch("https://api.github.com/users/nicomeyer96/repos?per_page=100", {
  headers: { Accept: "application/vnd.github+json" },
});
if (!response.ok) {
  if (response.status === 403 && response.headers.get("x-ratelimit-remaining") === "0") {
    if (!page.slice(start + startMarker.length, end).includes('class="software-stars"')) {
      throw new Error(`GitHub rate limit exhausted and ${destination} has no generated star counts`);
    }
    console.warn("GitHub API rate limit exhausted; keeping the previously generated software list unchanged. Star counts will refresh on the next render after the limit resets.");
    Deno.exit(0);
  }
  throw new Error(`GitHub repository request failed: ${response.status} ${response.statusText}`);
}

const repositories: unknown = await response.json();
if (!Array.isArray(repositories)) {
  throw new Error("GitHub repository response is not an array");
}

const starCounts = new Map<string, number>();
for (const repository of repositories) {
  if (
    typeof repository?.name !== "string" ||
    typeof repository?.stargazers_count !== "number" ||
    !Number.isInteger(repository.stargazers_count) ||
    repository.stargazers_count < 0 ||
    typeof repository?.fork !== "boolean"
  ) {
    throw new Error("GitHub repository response contains invalid data");
  }
  if (!repository.fork) {
    starCounts.set(repository.name, repository.stargazers_count);
  }
}

const selected = projects.map((project) => {
  const stars = starCounts.get(project.repo);
  if (stars === undefined) {
    throw new Error(`Public original repository not found: ${project.repo}`);
  }
  return { ...project, stars };
}).filter((project) => project.stars > 0)
  .sort((a, b) => b.stars - a.stars || a.repo.localeCompare(b.repo));

const lines = selected.map(({ repo, title, description, links = [], stars }) => {
  const resources = [
    { label: "GitHub", url: `https://github.com/nicomeyer96/${repo}` },
    ...links,
  ].map(({ label, url }) => `<a href="${url}">${label}</a>`).join("\n");
  const count = `<div class="software-stars" role="img" aria-label="${stars} GitHub ${stars === 1 ? "star" : "stars"}" title="GitHub stars">★ ${stars}</div>`;
  return `<article class="software-card">
<div class="software-card-heading">
<h2>${title}</h2>
${count}
</div>
<p class="software-description">${description}.</p>
<p class="software-links">${resources}</p>
</article>`;
});

const updated = `${page.slice(0, start + startMarker.length)}\n\n${lines.join("\n\n")}\n\n${page.slice(end)}`;
if (page !== updated) {
  await Deno.writeTextFile(destination, updated);
}
