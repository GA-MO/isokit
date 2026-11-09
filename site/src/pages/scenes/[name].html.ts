import type { APIRoute, GetStaticPaths } from 'astro';
import { contexts, examples } from '../../../../skill/examples/catalog';
import { stories } from '../../../../skill/examples/hero';
import { galleries } from '../../../../skill/examples/material-gallery';

export const getStaticPaths = (() => [
  ...[...examples.map(e => e.art), ...galleries.map(g => g.art), contexts.landing, contexts.docs, contexts.deck]
    .flatMap(a => (a.wide ? [a.compact, a.wide] : [a.compact]))
    .map(v => ({ params: { name: v.name }, props: { markup: v.markup } })),
  ...stories.slice(1).map(s => ({ params: { name: `hero-${s.slug}` }, props: { markup: s.art.html } })),
]) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => new Response(String(props.markup), { headers: { 'content-type': 'text/html; charset=utf-8' } });
