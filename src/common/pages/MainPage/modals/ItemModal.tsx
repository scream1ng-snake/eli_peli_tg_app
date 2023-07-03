import { observer } from "mobx-react-lite"
import React from "react"
import { Modal } from "../../../components"
import { useStore, useTheme } from "../../../hooks"
import './ItemModal.css'

export const ItemModal: React.FC<{
  course: CourseItem
}> = observer(({ course }) => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const { mainPage, cartStore } = useStore();
  const { itemModal } = mainPage;

  const [count, setCount] = React.useState(1);

  const addToCart = () => {
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        cartStore.addCourseToCart(course)
      }
      setCount(1)
      mainPage.itemModal.close()
    }
  }
  return (
    <Modal
      show={itemModal.show}
      onHide={() => itemModal.close()}
    >
      <img
        src="./gurmag.png" // todo there 
        className="item_modal_img"
      />
      <div className="item_modal_body">
        <h1>{course.Name}</h1>
        <span>Тип:</span>
        <div className="available_types">
          {/* todo src img here */}
          {/* todo as select option */}
          <img className="selected" src="./gurmag.png" />
          <img src="./gurmag.png" />
          <img src="./gurmag.png" />
          <img src="./gurmag.png" />
          <img src="./gurmag.png" />
        </div>
        <div className="count_and_price">
          <div className="row">
            <span>Количество:</span>
            <span>Стоимость:</span>
          </div>
          <div className="row">
            <div className="cout">
              <img 
                alt="Убавить" 
                className="minus" 
                src={isDarkMode ? 'LightMinus.png' : 'DarkMinus.png'} 
                onClick={() => setCount((prev) => (prev - 1) >= 0 ? prev - 1 : 0)} 
              />
              <span className="count">{count}</span>
              <img 
                alt="Добавить"
                className="plus" 
                src={isDarkMode ? './LightPlus.png' : './DarkPlus.png'}
                onClick={() => setCount((prev) => prev + 1)}
              />
            </div>
            <h5>{`${course.Discount_Price} ₽`}</h5>
          </div>
        </div>
        <div
          className="add_to_cart_button"
          onClick={addToCart}
          style={{ cursor: count > 0 ? 'pointer' : 'not-allowed' }}
        >
          <img src="./cart.svg" alt="Добавить в корзину" />
          <span>Добавить в корзину</span>
        </div>
      </div>
    </Modal>
  )
})