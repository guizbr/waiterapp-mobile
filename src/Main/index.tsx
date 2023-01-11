import { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';

import { Button } from '../components/Button';
import { Cart } from '../components/Cart';
import { Categories } from '../components/Categories';
import { Header } from '../components/Header';
import { Menu } from '../components/Menu';
import { TableModal } from '../components/TableModal';
import { Empty } from '../components/Icons/Empty';
import { Text } from '../components/Text';

import {
	Container,
	CategoriesContainer,
	MenuContainer,
	Footer,
	FooterContainer,
	CenteredContainer
} from './styles';

import { CartItem } from '../types/CartItem';
import { Product } from '../types/Product';
import { Category } from '../types/Category';
import { api } from '../utils/api';

export function Main() {
	const [isTableModalVisible, setIsTableModalVisible] = useState(false);
	const [selectedTable, setSelectedTable] = useState('');
	const [cartItems, setCartItems] = useState<CartItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [categories, setCategories] = useState<Category[]>([]);
	const [products, setProducts] = useState<Product[]>([]);
	const [isLoadingProducts, setIsLoadingProducts] = useState(false);

	useEffect(() => {
		Promise.all([
			api.get('/categories'),
			api.get('/products'),
		]).then(([categoriesResponse, productsResponse]) => {
			setCategories(categoriesResponse.data);
			setProducts(productsResponse.data);
			setIsLoading(false);
		});
	}, []);

	async function handleSelectCategory(categoryId: string) {
		const route = !categoryId ? '/products' : `/categories/${categoryId}/products`;

		setIsLoadingProducts(true);

		const { data } = await api.get(route);

		setProducts(data);
		setIsLoadingProducts(false);
	}

	function handleSaveTable(table: string) {
		setSelectedTable(table);
	}

	function handleResetOrder() {
		setSelectedTable('');
		setCartItems([]);
	}

	function handleAddToCart(product: Product) {
		if (!selectedTable) {
			setIsTableModalVisible(true);
		}

		//setCartItems((prevState) => prevState.concat(product) ou [...prevState, product]);
		setCartItems((prevState) => {
			const itemIndex = prevState.findIndex(cartItems => cartItems.product._id === product._id);

			if (itemIndex < 0) {
				return prevState.concat({
					quantity: 1,
					product,
				});
			}

			const newCartItems = [...prevState];
			const item = newCartItems[itemIndex];

			newCartItems[itemIndex] = {
				...item,
				quantity: item.quantity + 1
			};

			return newCartItems;
		});
	}

	function handleDecrementCartItem(product: Product) {
		setCartItems((prevState) => {
			const itemIndex = prevState.findIndex(cartItems => cartItems.product._id === product._id);
			const item = prevState[itemIndex];
			const newCartItems = [...prevState];

			if (item.quantity === 1) {
				newCartItems.splice(itemIndex, 1);

				return newCartItems;
			}

			newCartItems[itemIndex] = {
				...item,
				quantity: item.quantity - 1
			};

			return newCartItems;
		});
	}

	return (
		<>
			<Container>
				<Header
					selectedTable={selectedTable}
					onCancelOrder={handleResetOrder}
				></Header>

				{isLoading && (
					<CenteredContainer>
						<ActivityIndicator color='#D73035' size='large'></ActivityIndicator>
					</CenteredContainer>
				)}

				{!isLoading && (
					<>
						<CategoriesContainer>
							<Categories
								categories={categories}
								onSelectCategory={handleSelectCategory}
							></Categories>
						</CategoriesContainer>

						{isLoadingProducts ? (
							<CenteredContainer>
								<ActivityIndicator color='#D73035' size='large'></ActivityIndicator>
							</CenteredContainer>
						) : (
							<>
								{products.length > 0 ? (
									<MenuContainer>
										<Menu products={products} onAddToCart={handleAddToCart}></Menu>
									</MenuContainer>
								) : (
									<CenteredContainer>
										<Empty></Empty>
										<Text color='#666' style={{ marginTop: 24 }}>Nenhum produto foi encontrado!</Text>
									</CenteredContainer>
								)}
							</>
						)}
					</>
				)}
			</Container>

			<Footer>
				<FooterContainer>
					{!selectedTable && (
						<Button disabled={isLoading} onPress={() => setIsTableModalVisible(true)}>Novo Pedido</Button>
					)}

					{selectedTable && (
						<Cart
							cartItems={cartItems}
							onAdd={handleAddToCart}
							onDecrement={handleDecrementCartItem}
							onConfirmOrder={handleResetOrder}
							selectedTable={selectedTable}
						></Cart>
					)}
				</FooterContainer>
			</Footer>

			<TableModal
				visible={isTableModalVisible}
				onClose={() => setIsTableModalVisible(false)}
				onSave={handleSaveTable}
			></TableModal>
		</>
	);
}
