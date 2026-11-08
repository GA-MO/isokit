import type { APIRoute, GetStaticPaths } from 'astro';
import { contexts } from '../../../../skill/examples/catalog';

const { compact } = contexts.readme;

export const getStaticPaths = (() =>
  [compact].map(v => ({ params: { name: v.name }, props: { svg: v.scene.exportSvg({ title: 'A commit hops through build and test and lands on production' }) } }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => new Response(String(props.svg), { headers: { 'content-type': 'image/svg+xml' } });
