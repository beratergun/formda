import type { Food } from '../../domain/types';

interface OffProduct{code?:string;product_name?:string;product_name_tr?:string;nutriments?:Record<string,number>;serving_quantity?:number}
export async function searchPackaged(query:string,signal?:AbortSignal):Promise<Food[]>{
  const barcode=/^\d{8,14}$/.test(query.trim());
  const url=barcode?`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(query.trim())}.json?fields=code,product_name,product_name_tr,nutriments`:`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query.trim())}&search_simple=1&action=process&json=1&page_size=15&fields=code,product_name,product_name_tr,nutriments`;
  const response=await fetch(url,{signal,credentials:'omit',referrerPolicy:'no-referrer'});if(!response.ok)throw new Error('Ürün araması şu anda yanıt vermiyor.');
  const result=await response.json() as {product?:OffProduct;products?:OffProduct[]};
  return (result.products|| (result.product?[result.product]:[])).filter(p=>p.code&&p.product_name&&Number.isFinite(p.nutriments?.['energy-kcal_100g'])&&Number.isFinite(p.nutriments?.proteins_100g)).map(p=>({id:`off-${p.code}`,name:p.product_name_tr||p.product_name!,aliases:[],unit:'g',per:100,kcalPer:p.nutriments!['energy-kcal_100g'],proteinPer:p.nutriments!.proteins_100g,carbPer:p.nutriments!.carbohydrates_100g,fatPer:p.nutriments!.fat_100g,state:'na',source:`Open Food Facts · ${p.code}`,barcode:p.code,portions:[{label:'100 g',qty:100}],useCount:0}));
}
