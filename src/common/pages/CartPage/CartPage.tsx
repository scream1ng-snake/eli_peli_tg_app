import { Popup, Toast, Divider, Radio, Space, Skeleton, Dropdown, Selector, Input, DatePicker, Form, Collapse, Modal, Dialog, Picker, SelectorOption } from 'antd-mobile';
import Button from 'antd-mobile/es/components/button';
import { observer } from 'mobx-react-lite';
import moment from 'moment';
import React from 'react';
import Страничка from '../../components/layout/Page';
import { useInterval, useStore, useTelegram } from '../../hooks';
import { Optional, Undef } from '../../types';
import CartItem from './cartItem/CartItem';
import './CartPage.css';
import { toJS } from 'mobx';
import { ToastHandler } from 'antd-mobile/es/components/toast';
import { isDevelopment } from '../../helpers';
import { useNavigate } from 'react-router-dom';
import { LocationFill, RightOutline } from 'antd-mobile-icons';
import { ReceptionType } from '../../../store/stores';
import {getFormattedNumber, useMask} from "react-phone-hooks";
import { logger } from '../../features';
import { FC, useState, useMemo, useCallback, CSSProperties } from "react"
import { SelectLocationPopup } from '../../components';

const defaultMask = "+7 ... ... .. .."
const defaultPrefix = "+7"
const phoneRegex = /^((\+8|\+7)[\- ]?)?(\(?\d{3}\)?[\- ]?)?[\d\- ]{7,10}$/


export const CartPage: React.FC = observer(
  () => {
    const now = new Date()
    const after15min = moment().add(15, 'minutes')

    /** тост с загрузкой */
    const handler = React.useRef<ToastHandler>()
    const { userId } = useTelegram();
    const navigate = useNavigate();
    const { cartStore: cart, userStore, mainPage, auth } = useStore();

    /** Показывать ли датапикер для ввода даты */
    const [visibleDate, setVisibleDate] = useState(false);
    /** Показывать ли датапикер для ввода времени */
    const [visibleTime, setVisibleTime] = useState(false);

    /** сама дата */
    const [date, setDate] = useState(now);

    /** время заказа сразу + 15мин к текущему времени */
    const [time, setTime] = useState(after15min.format('HH:mm'));

    /**
     * из двух отдельных инпутов берем 
     * дату и время и слепляем 
     * в один ISO date
     */
    const outputDate = useMemo(() => {
      const [hours, minets] = time.split(':')
      const orderDate = date;
      orderDate.setHours(Number(hours));
      orderDate.setMinutes(Number(minets));
      return orderDate.toISOString()
    }, [date, time])

    const [
      contactPhone, 
      setContactPhone
    ] = useState<string>(userStore.userState.Phone ?? defaultPrefix);
  
    const errored = useMemo(() => {
      if(!contactPhone.length) return 'Введите номер телефона'
      if(!phoneRegex.test(contactPhone)) return 'Номер телефона указан неверно!'
      return null
    }, [contactPhone.length])
    

    function postOrder() { 
      // при оформлении заказа надо убедится чтобы 
      // на дату заказа были все блюда
      // если сегодня чего-то нет, то заказ на сегодня сделать нельзя
      /**
       * если сегодня нет какого-то блюда
       */
      const isNotAllowToday = cart.items
        .map(({ couse, quantity }) => couse.NoResidue ? false : quantity > couse.EndingOcResidue)
        .includes(true)

      /**
       * если заказ нужен на сегодня
       */
      const isOnToday = moment(outputDate).isSame(new Date(), 'day')
      
      if(isNotAllowToday && isOnToday) {
        // показывем диалог если только
        // сегодня чего-то нет
        // а пользователь поставил сегодня
        Dialog.show({
          title: 'Такой заказ только завтра',
          content: <div>
            <p>{`Некоторые блюда, которые вы хотели заказать сегодня уже закончились(((`}</p>
            <p>{`Вы сможете забрать заказ только завтра или позднее`}</p>
          </div>,
          closeOnAction: true, 
          closeOnMaskClick: true, 
          actions: [
            {
              key: 'tomorrow', 
              text: `Забрать завтра (${moment(outputDate).add(1,'days').format('YYYY-MM-DD HH:mm')})`, 
              onClick() {
                const fixedDate = moment(outputDate).add(1,'days').toDate();
                setDate(fixedDate);
                cart.postOrder({
                  itemsInCart: toJS(cart.items),
                  userId, 
                  currentOrg: String(isDevelopment() ? 146 : userStore.currentOrg),
                  contactPhone,
                  orderDate: fixedDate.toISOString()
                }, handler)
                  .then(() => {
                    Modal.confirm({
                      content: 'Поздравляем! Заказ оформлен!',
                      cancelText: 'Закрыть',
                      confirmText: 'Перейти в заказы',
                      onConfirm: () => {
                        navigate('/orders')
                      },
                    })
                  })
              },
            },
            {
              key: 'chooseAnother', 
              text: 'Выбрать другое время', 
              onClick() { setVisibleDate(true) },
            },
            {
              key: 'backToCart', 
              text: 'Вернуться к корзине'
            }
          ]
        })
        
      } else {
        if(auth.isFailed) {
          navigate('/authorize/' + contactPhone.replace(/\D/g, ''))
        } else {
          cart.postOrder({
            itemsInCart: toJS(cart.items),
            userId, 
            currentOrg: String(isDevelopment() ? 146 : userStore.currentOrg),
            contactPhone: contactPhone.replace(/\D/g, ''),
            orderDate: outputDate
          }, handler)
            .then(() => {
              Modal.confirm({
                content: 'Поздравляем! Заказ оформлен!',
                cancelText: 'Закрыть',
                confirmText: 'Перейти в заказы',
                onConfirm: () => {
                  navigate('/orders')
                },
              })
            })
        }
      }
    }

    useInterval(() => {
      // каждую минуту проверяем чтобы время заказа не
      // стало раньше чем текущее время
      // * если заказ на сегодня
      if(moment(date).isSame(new Date(), 'day')) {
        // * если время заказа указано раньше чем 
        // * текущее время + время на готовку
        const [orderHours, orderMinets] = time.split(':')
        const [nowHours, nowMinets] = moment()
          .format('HH:mm')
          .split(':')

        if(
          ((Number(orderHours) * 60) + Number(orderMinets)) < 
          ((Number(nowHours) * 60) + Number(nowMinets) + 15)
        ) {
          setTime(moment().add(15, 'minutes').format('HH:mm'))
        }
      }
    }, 1000 * 60)

    return (
      <Страничка>
        <TimeSelector 
          visible={visibleTime}
          setVisible={setVisibleTime}
          currentTime={time}
          setTime={setTime}
          currentDate={date}
          setDate={setDate}
        />
        <DateSelector 
          visible={visibleDate}
          setVisible={setVisibleDate} 
          setDate={setDate}
          beginInTomorrow={cart.items
            .map(({ couse, quantity }) => 
              couse.NoResidue 
                ? false 
                : quantity > couse.EndingOcResidue
            )
            .includes(true)}
        />
        {userStore.orgstate === 'COMPLETED'
          && userStore.userLoad === 'COMPLETED' 
          && userStore.needAskAdress 
          && <SelectLocationPopup />
        }
        {auth.isFailed
          ? <div style={{height: '58px'}} />
          : null 
        }
        <Страничка.Тело>
        
        {cart.isEmpty 
          ? null
          : <WaitYouInOrganization />
        }
        {mainPage.isLoading && mainPage.cookIsLoading 
          ? preloader()
          : <>
            {!cart.isEmpty
              ? cart.items.map((item, index) => {
                const { 
                  dishSet, 
                  allCampaign, 
                  dishDiscounts, 
                  percentDiscounts 
                } = userStore.userState
                
                /** ищем основную инфу */
                const campaignAllInfo = allCampaign.find(camp =>
                  camp.VCode === item.campaign
                )
                /** ищем детали для этой скидки в скидках на блюда */
                const dishDiscount = dishDiscounts.filter(dishDiscount =>
                  dishDiscount.vcode === item.campaign
                ).find(dishDiscount => 
                  dishDiscount.dish === item.couse.VCode
                )

                /** ищем детали для этой скидки в процентных скидках */
                const percentDiscount = percentDiscounts.find(percentDiscount =>
                  percentDiscount.vcode === item.campaign
                )


                /** ищем детали для этой скидки в скидках на сеты */
                const setDish = dishSet.filter((setDish) =>
                  setDish.vcode === item.campaign
                ).find(setDish =>
                  Boolean(setDish.dishes.find(dishSet =>
                    dishSet.dish === item.couse.VCode
                  ))
                )


                let text: Optional<string> = null;
                let dishArr: Undef<CourseItem>[] = []; 
                // должна найтись только одна из трех 
                // если это скидка 
                // на одно блюдо
                if (dishDiscount && !percentDiscount && !setDish) {
                  const targetDish = mainPage.getDishByID(dishDiscount.dish)
                  if (targetDish?.Name)
                    if(dishDiscount.price) {
                      text = `Cкидка ${dishDiscount.price}руб на "${targetDish?.Name}"`
                    }
                    // @ts-ignore
                    if(dishDiscount.discountPercent) {
                      // @ts-ignore
                      text = `Cкидка ${dishDiscount.discountPercent}% на "${targetDish?.Name}"`
                    }
                    
                  
                }

                // если это процентная скидка
                if (!dishDiscount && percentDiscount && !setDish) {
                  const { MaxSum, MinSum, discountPercent, bonusRate } = percentDiscount;
                  text = `Cкидка ${discountPercent}% на сумму от ${MinSum} до ${MaxSum} руб`;
                  if (bonusRate) text = text + ` + ${bonusRate} бонусных баллов`
                }

                // если это скидка на сет
                if (!dishDiscount && !percentDiscount && setDish) {
                  text = `Cкидка на ${setDish.dishCount} блюда из списка`;
                  dishArr = setDish.dishes.map((dishDiscount) =>
                    mainPage.getDishByID(dishDiscount.dish)
                  )
                }


                return(
                  <CartItem
                    key={`cart_item_${index}`}
                    courseInCart={item}
                    add={() => cart.addCourseToCart(item.couse)}
                    remove={() => cart.removeFromCart(item.couse.VCode)}
                    campaignAllInfo={campaignAllInfo}
                    text={text}
                  />
                )
              })
              : <div 
                style={{
                  width: '100%', 
                  height: '100%', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  marginTop: '1rem'
                }}>
                <p>Корзина пуста 🛒</p>
              </div>
            }
          </>
        }
        
        {cart.isEmpty 
          ? null 
          : <div style={{width: '100%'}}>
            <p 
              style={{
                fontFamily: 'Roboto',
                fontSize: '18px',
                fontWeight: '700',
                lineHeight: '21px',
                letterSpacing: '0em',
                textAlign: 'left', 
                margin: '17px'
              }}
            >
              Способ полученя заказа
            </p>
            <Selectable
              options={cart.deliveryOptions}
              value={[cart.receptionType]}
              onChange={selected => cart.setReceptionType(selected)}
            />
            {/* <Selector
              style={{display: 'flex', justifyContent: 'center'}}
              options={cart.deliveryOptions}
              value={[cart.receptionType]}
              onChange={(arr) => cart.setReceptionType(arr[0])}
            /> */}
            {cart.receptionType === 'pickup' 
              ? null
              : <>
                <Divider contentPosition='left'>Введите адрес доставки</Divider>
                <Form>
                  <Form.Item label='Ваш адрес, чтобы доставщик мог вас найти'>
                    <Input 
                      placeholder='Ул. Пушикна, Дом Колотушшкина 273819237'
                    />
                  </Form.Item>
                </Form>
              </>
            }
            <DetailForm 
              showDateSelector={setVisibleDate}
              showTimeSelector={setVisibleTime}
              selectedDate={date}
              selectedTime={time}
              contactPhone={contactPhone}
              setContactPhone={setContactPhone}
              errored={errored}
            />
            
          </div>
        }

        <Space 
          style={{ 
            width: '100%', 
            marginTop: '0.75rem', 
            marginLeft: '27px', 
            marginRight: '1rem', 
            "--gap": '0' 
          }} 
          justify='between' 
          align='center'
        >
          <Space direction='vertical' style={{"--gap": '8px'}}>
            <span style={{fontSize: '18px', color: 'var(--тихий-текст)', fontWeight: '700'}}>Итого:</span>
            <span style={{fontSize: '20px', color: 'var(--громкий-текст)', fontWeight: '600'}}>
              {`${Math.ceil(cart.totalPrice * 10) / 10} ₽`}
            </span>
          </Space>
          <Button 
            block  
            size='large' 
            disabled={cart.isEmpty}
            style={{
              borderRadius: '8px', 
              background: 'var(--gurmag-accent-color)', 
              paddingLeft: '2.5rem',
              paddingRight: '2.5rem'
            }}
            onClick={() => errored
              ? Toast.show({ content: 'Укажите номер телефона', position: 'center' })
              : postOrder()
            }
          >
            Оформить заказ
          </Button>
        </Space>
        </Страничка.Тело>
      </Страничка>
    )
  }
)



const preloader = () => <> 
  <Skeleton animated style={skeletonStyle} />
  <Skeleton animated style={skeletonStyle} />
</>

const skeletonStyle = {
  width: '100%', 
  height: '100px', 
  borderRadius: '8px', 
  marginTop: '1rem'
}

const Selectable: React.FC<{
  onChange: (selected: ReceptionType) => void,
  value: ReceptionType[] | undefined, 
  options:any
}> = ({ onChange, options, value }) => {

  const [val, setVal] = React.useState<ReceptionType>(options[0].value)
  return(
    <div 
      style={{ display: 'flex', justifyContent: 'center' }}
    >
      <div 
        style={{
          borderRadius: '100px',
          overflow: 'hidden',
          display: 'inline-flex',
        }}
      >
        {options.map((option: any , index: any) => 
          <div 
            key={option.value}
            style={{ 
              fontSize: '12px',
              fontWeight: '700',
              lineHeight: '1',
              padding: '13px 21px',
              background: option.value === val ? '#017DC5' : 'none',
              color: option.value === val ? 'white' : 'var(--tg-theme-text-color)', 
              borderTopLeftRadius: index === 0 ? '100px' : '0',
              borderBottomLeftRadius: index === 0 ? '100px' : '0',
              borderTopRightRadius: index === options.length - 1 ? '100px' : '0',
              borderBottomRightRadius: index === options.length - 1 ? '100px' : '0',
              border: option.value !== val ? '1px solid #F2F2F2' : 'none', 
              cursor: option.disabled ? 'not-allowed' : 'default', 
              opacity: option.disabled ? '0.4' : '1'
            }}
            onClick={() => {
              if(!option.disabled) {
                setVal(option.value)
                onChange(option.value)
              }
            }}

          >
            {option.label}
          </div>
        )}
      </div>
    </div>
  )
}


interface TimeSelectorProps {
  visible: boolean 
  setVisible: (bool: boolean) => void
  currentDate: Date
  setDate: (date: Date) => void
  currentTime: string
  setTime: (time: string) => void
}
const TimeSelector: FC<TimeSelectorProps> = props => {
  const { 
    visible, setVisible, 
    currentDate, setDate, 
    currentTime, setTime
  } = props

  const initialTime = moment().add(15, 'minutes')

  const [pickerM, setPickerM] = useState(initialTime.format('mm'))
  const [pickerH, setPickerH] = useState(initialTime.format('HH'))

  type pic = { label: string, value: string }
  const workrange = useMemo(() => {
    
    let hours: pic[] = [];
    let minutes: pic[] = [];
    function fillMinutes(start: number, end: number) {
      for(let i = start; i <= end; i++) {
        const value = i < 10 ? `0${i}` : `${i}`
        minutes.push({ label: value, value })
      }
    }
    function fillHours(start: number, end: number) {
      for(let i = start; i <= end; i++) { 
        const value = i < 10 ? `0${i}` : `${i}`
        hours.push({ label: value, value })
      }
    }
    const minH = 9;
    const maxH = 21;
    // если выбрана сегодняшняя дата
    if(moment(currentDate).isSame(new Date(), 'day')) {
      logger.log(
        "если выбрана сегодняшняя дата, " + 
        "сетаем только диапазон от текущего времени до конца рабочего дня",
        "cart-page memo workrange"
      )
      // сетаем только диапазон от текущего времени до конца рабочего дня
      const nowH = moment().add(15, 'minutes').hours();
      const nowM = moment().minutes();

      // если время не рабочее но дата сегодняшняя
      if(
        (nowH * 60 + nowM) > 21 * 60 + 30 || 
        (nowH * 60 + nowM) < 9 * 60 + 30
      ) {
        logger.log(
          "если время не рабочее но дата сегодняшняя",
          "cart-page memo workrange"
        )
        if((nowH * 60 + nowM) > 21 * 60 + 30) {
          logger.log(
            "если время позже 21 30 то делаем дату на завтра",
            "cart-page memo workrange"
          )
          setDate(moment().add(1, 'day').toDate())
        }
        if((nowH * 60 + nowM) < 9 * 60 + 30) {
          logger.log(
            "если время раньше 9 30 то дату не трогаем но сетаем время",
            "cart-page memo workrange"
          )
          setTime("09:45")
        }
      }
      // сетаем оставшиеся раб часы
      fillHours(nowH, maxH)
      // если это текущий час
      // то мы не должны выбрать минуты раньше чем текущие минуты
      if(pickerH === hours[0]?.value) {
        if(pickerH === '21') {
          if(nowM <= 15) {
            fillMinutes(nowM + 15, 30)
          }
        } else if(pickerH === '09') {
          if(nowM >= 15) {
            fillMinutes(nowM, 59)
          }
        } else {
          if(nowM < 45) {
            fillMinutes(nowM + 15, 59)
          } else {
            fillMinutes(nowM + 15 - 60, 59)
          }
        }
      } else {
        if(pickerH === '21') {
          fillMinutes(0, 30)
          // с 8:30
        } else if (pickerH === '09') {
          fillMinutes(30, 59)
          // в остальных случаях полный час минуток
        } else {
          fillMinutes(0, 59)
        }
      }
    } else {
      // иначе сетаем всё время работы
      // сетаем раб часы с 9 до 21
      fillHours(minH, maxH);
      // до 21:30
      if(pickerH === '21') {
        fillMinutes(0, 30)
        // с 8:30
      } else if (pickerH === '09') {
        fillMinutes(30, 59)
        // в остальных случаях полный час минуток
      } else {
        fillMinutes(0, 59)
      }
    }
    
    return [
      hours, 
      minutes 
    ]
  }, [currentDate, currentTime, pickerH, pickerM])
  return(
    <Picker
      columns={workrange}
      visible={visible}
      onClose={() => setVisible(false)}
      onConfirm={picked => { 
        setTime(picked.join(':'))
      }}
      onSelect={val => {
        setPickerM(val[1] as string)
        setPickerH(val[0] as string)
      }}
      confirmText='Сохранить'
      cancelText='Закрыть'
      defaultValue={currentTime.split(':')}
    />
  )
}


interface DateSelectorProps {
  visible: boolean
  setVisible: (bool: boolean) => void
  setDate: (date: Date) => void
  beginInTomorrow: boolean
}
const DateSelector: FC<DateSelectorProps> = props => {
  const now = new Date()
  const tomorrow = moment()
    .add(1,'days')
    .toDate()
  
  const { visible, setVisible, setDate, beginInTomorrow } = props
  return (
    <DatePicker 
      visible={visible}
      onClose={() => setVisible(false)}
      onConfirm={isoStr => setDate(isoStr)}
      defaultValue={now}
      min={beginInTomorrow ? tomorrow : now }
      confirmText='Сохранить'
      cancelText='Закрыть'
    />
  )
}

const waitStyles = {
  hello: {
    fontFamily: 'Roboto',
    fontSize: '18px',
    fontWeight: '700',
    lineHeight: '21px',
    letterSpacing: '0em',
    textAlign: 'left', 
    margin: '17px 17px 0 17px'
  },
  dropdownItem: { 
    justifyContent: 'left', 
    margin: '10px 10px 0 10px' 
  },
  orgWrapper: { 
    padding: '0 2.5vw 0 2.5vw', 
    width: '92vw', 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    border: '1px solid var(--adm-border-color)', 
    borderRadius: '8px' 
  }, 
  orgText: {
    fontSize: '18px', 
    color: 'var(--громкий-текст)', 
    margin: '10px', 
    fontWeight: '400'
  },
  orgIcon: { 
    color: 'var(--gurmag-accent-color)', 
    fontSize: '20px' 
  }
}

const WaitYouInOrganization: FC = observer(props => {
  const { userStore } = useStore()
  return <>
    <p style={waitStyles.hello as CSSProperties}>
      Ждём тебя в предприятии: 
    </p>
    <Dropdown>
      <Dropdown.Item 
        arrow={null}
        style={waitStyles.dropdownItem} 
        className='hui'
        key='sorter' 
        title={
          <div style={waitStyles.orgWrapper}>
            <span style={waitStyles.orgText}>
              {userStore.currentOrganizaion?.Name}
            </span>
            <LocationFill style={waitStyles.orgIcon} />
          </div>
        }
      >
        <div style={{ padding: 12 }}>
          <Radio.Group 
            defaultValue={userStore.currentOrg}
            onChange={e => {
              userStore.currentOrg = e as number
              userStore.saveCurrentOrg(e as number)
            }}
          >
            <Space direction='vertical' block>
              {userStore.organizations.map(org => 
                <Radio block value={org.Id} key={org.Id}>
                  {org.Name}
                </Radio>
              )}
            </Space>
          </Radio.Group>
        </div>
      </Dropdown.Item>
    </Dropdown>
  </>
})


const detailFormStyle = {
  gridContainer: {
    margin: '30px 1rem 30px 1rem', 
    width: 'calc(100% - 2rem)', 
    display: 'grid', 
    gridAutoColumns: '1fr', 
    gridTemplateColumns: '1fr 1fr',  
    gridTemplateRows: '1fr 1fr',  
    gap: '18px 10px',  
    gridTemplateAreas: `
      "contactsPhone phone"
      "orderTime time"
    `
  },
  phoneLabel: { 
    gridArea: 'contactsPhone', 
    alignSelf: 'center', 
    fontSize: '16px', 
    fontWeight: '500', 
    color: 'var(--тихий-текст)' 
  },
  phone: { 
    gridArea: 'phone', 
    alignSelf: 'center', 
    fontSize: '18px', 
    fontWeight: '400', 
    color: 'var(--громкий-текст)' 
  },
  errSpan: {
    color: 'var(--adm-color-danger)', 
    fontSize: 12
  }, 
  phoneInput: {
    '--text-align': 'center',
    width: "100%",
    borderRadius: "100px", 
    padding: "0.5rem 1rem",
    fontSize: "18px",
  },
  timeLabel: { 
    gridArea: 'orderTime', 
    alignSelf: 'center', 
    fontSize: '16px', 
    fontWeight: '500', 
    color: 'var(--тихий-текст)' 
  },
  timeValues: { 
    gridArea: 'time', 
    alignSelf: 'center', 
    fontSize: '18px', 
    fontWeight: '400', 
    color: 'var(--громкий-текст)' 
  }
}
interface DetailFormProps {
  showDateSelector: (bool: boolean) => void
  showTimeSelector: (bool: boolean) => void
  selectedDate: Date
  selectedTime: string
  setContactPhone: (str: string) => void
  contactPhone: string
  errored: Optional<string>
}
const DetailForm: FC<DetailFormProps> = observer(properties => {
  const { 
    showDateSelector, 
    showTimeSelector, 
    selectedDate, 
    selectedTime, 
    setContactPhone, 
    contactPhone, 
    errored
  } = properties
  
  return(
    <div style={detailFormStyle.gridContainer}>
      <div style={detailFormStyle.phoneLabel}>
        Контактный телефон
      </div>
      <div style={detailFormStyle.phone}>
        <Input 
          type="tel"
          placeholder='Введите ваш номер'
          onChange={str => setContactPhone(getFormattedNumber(str, defaultMask))}
          { ...useMask(defaultMask) } 
          value={contactPhone}
          style={{
            border: errored
              ? '1px solid var(--adm-color-danger)'
              : "1px solid var(--громкий-текст)",
            ...detailFormStyle.phoneInput,
          }}
        />
        {errored &&
          <span style={detailFormStyle.errSpan}>
            {errored}
          </span>
        }
      </div>
      <div style={detailFormStyle.timeLabel}>
        Приготовить заказ ко времени:
      </div>
      <div style={detailFormStyle.timeValues}>
        <Space style={{"--gap": '1.25rem', fontSize: '20px'}}>
          <span onClick={() => showDateSelector(true)}>
            {moment(selectedDate).format('DD-MM-YYYY')}
          </span>
          <span onClick={() => showTimeSelector(true)}>
            {selectedTime}
          </span>
        </Space>
      </div>
    </div>
  )
})