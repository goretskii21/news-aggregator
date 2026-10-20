// User reads Russian but does not want Russian domestic/company news.
// Match headlines, not publisher domains, author names or feed boilerplate.
const russianMarket = /росси[яиюей]|россиян|российск|(?:^|[^\p{L}])РФ(?:$|[^\p{L}])|\b(?:Russia|Russian|Russians|Russian Federation)\b/iu;
const russianCompany = /яндекс|сбер(?:банк)?|касперск|ростелеком|мегафон|рутелеком|вконтакте|вк\s+(?:облак|видео|игр)|мэйл\.ру|майл\.ру|мтс|озон|вайлдберриз|рутуб|селектел|таймвеб|мойофис|ред\s+ос|астра\s+линукс|группа\s+астра|\b(?:Yandex|Sber|Sberbank|Kaspersky|Rostelecom|MegaFon|VK|Mail\.ru|MTS|Ozon|Wildberries|Rutube|Selectel|Timeweb|Yadro|Astra Linux|RED OS|MyOffice|R7 Office|Elbrus|Baikal Electronics|T-Bank|Tinkoff)\b/iu;
export function editorialExclusion(item){
 // Preserve confirmed exploited vulnerabilities in the user's stack; selection
 // still checks product relevance before putting these in Critical.
 if(item.knownExploited===true)return null;
 if(russianMarket.test(item.title))return 'russian-domestic-focus';
 if(russianCompany.test(item.title))return 'russian-company-focus';
 return null;
}
