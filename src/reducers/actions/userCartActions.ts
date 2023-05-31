import { Dispatch } from 'redux';
import { ADD_COURSE, APPLE_DISCOUNT, DELETE_COURSE, UserCoursePayload } from '../userCart/userCartTypes';
import { CourseItem } from '../menuData/menuDataLoadTypes';
import { UserInfoState } from '../userInfo/userInfoTypes';


export function addCourseToCart(couse: CourseItem, userInfo: UserInfoState) {
  let addCurse: UserCoursePayload = {
    couse: couse,
    percentDiscounts: userInfo.percentDiscounts,
    dishDiscounts: userInfo.dishDiscounts,
    allCampaign: userInfo.allCampaign,
    dishSet: userInfo.dishSet,
  }
  return {
    type: ADD_COURSE,
    payload: addCurse,
  };
}

export function dropCourseFromCart(couse: CourseItem, userInfo: UserInfoState) {
  let addCurse: UserCoursePayload = {
    couse: couse,
    percentDiscounts: userInfo.percentDiscounts,
    dishDiscounts: userInfo.dishDiscounts,
    allCampaign: userInfo.allCampaign,
    dishSet: userInfo.dishSet,
  }
  return {
    type: DELETE_COURSE,
    payload: addCurse,
  };
}

export function applyDiscountForCart(userInfo: UserInfoState) {
  let addCurse: UserCoursePayload = {
    couse: {
      VCode: 0,
      Name: '',
      CatVCode: 0,
      Discount_Price: 0,
      Price: 0,
    },
    percentDiscounts: userInfo.percentDiscounts,
    dishDiscounts: userInfo.dishDiscounts,
    allCampaign: userInfo.allCampaign,
    dishSet: userInfo.dishSet,
  }
  return {
    type: APPLE_DISCOUNT,
    payload: addCurse,
  };
}
