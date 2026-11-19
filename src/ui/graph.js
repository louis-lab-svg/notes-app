// Vue graphe : chaque note est un point, chaque lien un trait.
// La bibliothèque force-graph gère le zoom (molette / pincer), le déplacement
// (glisser) et le clic sur un point.
import ForceGraph from 'force-graph';

let graph = null;

/** Petite force qui attire chaque point vers le centre : les notes sans lien ne partent pas au loin. */
function gravity(strength) {
  let nodes = [];
  const force = (alpha) => {
    for (const n of nodes) {
      n.vx -= n.x * strength * alpha;
      n.vy -= n.y * strength * alpha;
    }
  };
  force.initialize = (ns) => (nodes = ns);
  return force;
}

/** Lit une couleur définie dans style.css (pour suivre le mode clair/sombre). */
const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/**
 * Affiche le graphe dans `container`.
 * @param data      { nodes, links } venant de buildGraph()
 * @param currentId id de la note ouverte (mise en avant)
 * @param onOpen    appelé avec le point cliqué
 */
export function showGraph(container, data, currentId, onOpen) {
  // Nombre de liens par point → les notes très reliées sont plus grosses.
  const degree = new Map();
  for (const l of data.links) {
    degree.set(l.source, (degree.get(l.source) || 0) + 1);
    degree.set(l.target, (degree.get(l.target) || 0) + 1);
  }
  const radius = (node) => 4 + Math.min(8, Math.sqrt(degree.get(node.id) || 0) * 2);

  if (!graph) {
    graph = new ForceGraph(container)
      .nodeId('id')
      .nodeLabel(() => '') // le nom est déjà dessiné sous le point
      .linkWidth(1)
      .cooldownTicks(150)
      .onNodeClick((node) => graph.onOpen?.(node))
      .d3Force('gravity', gravity(0.06));
    graph.d3Force('charge').strength(-80);
    // Le graphe prend toute la place disponible, même quand la fenêtre change de taille.
    new ResizeObserver(() => {
      graph.width(container.clientWidth).height(container.clientHeight);
    }).observe(container);
  }
  graph.onOpen = onOpen;

  const colors = {
    node: cssVar('--muted'),
    current: cssVar('--accent'),
    missing: cssVar('--border'),
    text: cssVar('--text'),
    link: cssVar('--border'),
  };

  graph
    .width(container.clientWidth)
    .height(container.clientHeight)
    .backgroundColor(cssVar('--bg'))
    .linkColor(() => colors.link)
    .nodeCanvasObject((node, ctx, scale) => {
      const r = radius(node);
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
      ctx.fillStyle = node.id === currentId ? colors.current : node.missing ? colors.missing : colors.node;
      ctx.fill();
      // Les noms n'apparaissent qu'à partir d'un certain zoom, pour rester lisible.
      if (scale > 0.7) {
        const fontSize = 12 / scale;
        ctx.font = `${fontSize}px -apple-system, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = node.missing ? colors.node : colors.text;
        ctx.fillText(node.name, node.x, node.y + r + 2 / scale);
      }
    })
    // Zone de clic plus large que le point : plus facile à toucher au doigt.
    .nodePointerAreaPaint((node, color, ctx) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius(node) + 6, 0, 2 * Math.PI);
      ctx.fill();
    })
    .onEngineStop(() => {
      if (graph.fitPending) {
        graph.fitPending = false;
        graph.zoomToFit(400, 40);
      }
    })
    .graphData(data);
  graph.fitPending = true;
}

/** Recentre le graphe pour voir tous les points. */
export function fitGraph() {
  graph?.zoomToFit(400, 40);
}
