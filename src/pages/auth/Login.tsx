import React, { FC, useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import { motion } from 'framer-motion';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import Page from '../../layout/Page/Page';
import Card, { CardBody } from '../../components/bootstrap/Card';
import FormGroup from '../../components/bootstrap/forms/FormGroup';
import Input from '../../components/bootstrap/forms/Input';
import Button from '../../components/bootstrap/Button';
import Logo from '../../components/Logo';
import AuthContext from '../../contexts/authContext';
import Spinner from '../../components/bootstrap/Spinner';
import { ApiError } from '../../api/types';
import { showAppSuccess } from '../../helpers/appNotify';
import { toFieldErrors } from '../../helpers/formErrors';
import { homePathForUser } from '../../menu';

const Login: FC = () => {
	const { login } = useContext(AuthContext);
	const navigate = useNavigate();
	const [isLoading, setIsLoading] = useState<boolean>(false);

	const formik = useFormik({
		initialValues: {
			login: '',
			password: '',
		},
		validate: (values) => {
			const errors: { login?: string; password?: string } = {};
			if (!values.login) errors.login = 'Email is required.';
			if (!values.password) errors.password = 'Password is required.';
			return errors;
		},
		validateOnChange: false,
		onSubmit: async (values, helpers) => {
			setIsLoading(true);
			try {
				const user = await login(values.login.trim(), values.password);
				showAppSuccess('Signed in successfully', `Welcome back, ${user.name}.`);
				navigate(`/${homePathForUser(user)}`);
			} catch (error) {
				const apiErrors = toFieldErrors(error);
				const loginError = apiErrors.login || apiErrors.email;
				const passwordError = apiErrors.password;
				if (loginError || passwordError) {
					helpers.setErrors({
						...(loginError ? { login: loginError } : {}),
						...(passwordError ? { password: passwordError } : {}),
					});
				} else {
					helpers.setFieldError(
						'login',
						error instanceof ApiError
							? error.message
							: 'Login failed. Please try again.',
					);
				}
				void helpers.setTouched({ login: true, password: true }, false);
			} finally {
				setIsLoading(false);
			}
		},
	});

	return (
		<PageWrapper isProtected={false} title='Login' className='gps-login'>
			<Page className='p-0'>
				<div className='row h-100 align-items-center justify-content-center px-3'>
					<div className='col-xl-4 col-lg-6 col-md-8'>
						<motion.div
							initial={{ opacity: 0, y: 24 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5, ease: 'easeOut' }}>
							<Card className='gps-login-card'>
								<CardBody className='p-4 p-md-5'>
									<div className='text-center mb-4'>
										<Link
											to='/'
											aria-label='Loan Management System'
											className='d-inline-block mb-3'>
											<Logo variant='stack' size={168} />
										</Link>
										<p className='gps-login-copy mb-0'>Sign in to continue.</p>
									</div>

									<form
										className='row g-4'
										noValidate
										action='#'
										method='post'
										onSubmit={(event) => {
											event.preventDefault();
											void formik.submitForm();
										}}>
										<div className='col-12'>
											<FormGroup id='login' isFloating label='Email' required>
												<Input
													type='email'
													autoComplete='username'
													value={formik.values.login}
													isTouched={Boolean(
														formik.touched.login || formik.errors.login,
													)}
													invalidFeedback={formik.errors.login}
													isValid={!formik.errors.login}
													onChange={formik.handleChange}
													onBlur={formik.handleBlur}
												/>
											</FormGroup>
										</div>
										<div className='col-12'>
											<FormGroup
												id='password'
												isFloating
												label='Password'
												required>
												<Input
													type='password'
													autoComplete='current-password'
													value={formik.values.password}
													isTouched={Boolean(
														formik.touched.password ||
														formik.errors.password,
													)}
													invalidFeedback={formik.errors.password}
													isValid={!formik.errors.password}
													onChange={formik.handleChange}
													onBlur={formik.handleBlur}
												/>
											</FormGroup>
										</div>
										<div className='col-12'>
											<Button
												type='submit'
												action='submit'
												className='w-100 py-3'
												isDisable={isLoading}>
												{isLoading && <Spinner isSmall inButton isGrow />}
												Sign in
											</Button>
										</div>
									</form>
								</CardBody>
							</Card>
						</motion.div>
					</div>
				</div>
			</Page>
		</PageWrapper>
	);
};

export default Login;
