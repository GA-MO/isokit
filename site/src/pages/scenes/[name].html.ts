import type { APIRoute, GetStaticPaths } from 'astro';
import { examples } from '../../../../skill/examples/catalog';
import { galleries } from '../../../../skill/examples/material-gallery';
import { inContext as abTest } from '../../../../skill/examples/ab-test';
import { inContext as checkout } from '../../../../skill/examples/checkout-payment';
import { inContext as ciDeploy } from '../../../../skill/examples/ci-deploy';
import { inContext as etl } from '../../../../skill/examples/etl-pipeline';

export const getStaticPaths = (() =>
  [...examples.map(e => e.art), ...galleries.map(g => g.art), abTest, checkout, ciDeploy, etl]
    .flatMap(a => (a.wide ? [a.compact, a.wide] : [a.compact]))
    .map(v => ({ params: { name: v.name }, props: { markup: v.markup } }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => new Response(String(props.markup), { headers: { 'content-type': 'text/html; charset=utf-8' } });
