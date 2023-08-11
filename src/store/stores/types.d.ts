/** Тип блюда */
type CourseItem = {
  VCode: number,
  Name: string,
  CatVCode: number,
  Discount_Price: number,
  Price: number,
  Quality: number,
}

/** Тип категории с блюдами */
type CategoryCourse = {
  VCode: number,
  Name: string,
  MenuVCode: number,
  CourseList: CourseItem[],
}

/** Блюдо в корзине как часть заказа */
type CouseInCart = {
  couse: CourseItem;
  quantity: number;
  priceWithDiscount: number;
  campaign?: number | undefined;
}

type PercentDiscount = {
  vcode: number,
  MinSum: number,
  MaxSum: number,
  bonusRate: number,
  discountPercent: number,
}

type DishDiscount = {
  vcode: number,
  isset: number,
  quantity: number,
  promocode: string,
  dish: number,
  price: number,
}

type DishSetDiscount = {
  vcode: number,
  dishes: DishDiscount[],
  dishCount: number,
}

interface DishSetDiscountActive extends DishSetDiscount {
  countInCart: number,
}

type AllCampaignUser = {
  Name: string,
  Description: string,
  VCode: number,
  periodtype: string,
  isset: number,
  quantity: number,
  promocode: string
}

/** Организация */
type Organization = {
  Id: number,
  Name: string,
  isCK: number,
}

type UserInfoState = {
  userName: string,
  userBonuses: number,
  percentDiscounts: PercentDiscount[],
  dishDiscounts: DishDiscount[],
  allCampaign: AllCampaignUser[],
  dishSet: DishSetDiscount[],
}

type UserCoursePayload = {
  couse: CourseItem,
  percentDiscounts: PercentDiscount[],
  dishDiscounts: DishDiscount[],
  allCampaign: AllCampaignUser[],
  dishSet: DishSetDiscount[],
}

