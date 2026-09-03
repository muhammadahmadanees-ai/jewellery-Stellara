import ProductDetailPage, {
  generateMetadata as generateProductMetadata,
  generateStaticParams as generateProductStaticParams,
} from '../../products/[slug]/page';

export const revalidate = 3600;

export async function generateStaticParams() {
  return generateProductStaticParams();
}

export async function generateMetadata(props) {
  return generateProductMetadata(props);
}

export default function ProductAliasPage(props) {
  return <ProductDetailPage {...props} />;
}
