import { Component, OnInit, OnDestroy, signal, output } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { OrdersService } from '../../services/orders.service';
import { CatalogService, Product, Category } from '../../services/catalog.service';
import { ToastService } from '../../../shared/services/toast.service';
import { CreateOrderRequest, CreateOrderItem, DeliveryAddress } from '../../interfaces/order.interface';

// Using Product interface from CatalogService instead of SKU

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

@Component({
  selector: 'app-create-order-modal',
  standalone: false,
  templateUrl: './create-order-modal.component.html',
  styleUrls: ['./create-order-modal.component.scss']
})
export class CreateOrderModalComponent implements OnInit, OnDestroy {
  orderForm: FormGroup;
  isLoading = signal<boolean>(false);
  currentStep = signal<number>(1);
  totalSteps = 3;

  // Data
  customers = signal<Customer[]>([]);
  products = signal<Product[]>([]);
  filteredProducts = signal<Product[]>([]);
  categories = signal<Category[]>([]);

  // Outputs
  orderCreated = output<void>();
  close = output<void>();

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private ordersService: OrdersService,
    private catalogService: CatalogService,
    private toastService: ToastService
  ) {
    this.orderForm = this.createForm();
  }

  ngOnInit() {
    this.loadCustomers();
    this.loadProducts();
    this.loadCategories();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  createForm(): FormGroup {
    return this.fb.group({
      // Customer Information
      customerId: ['', Validators.required],
      customerName: [''],
      customerEmail: ['', [Validators.email]],
      customerPhone: [''],

      // Order Items
      items: this.fb.array([], Validators.required),

      // Delivery Address
      includeDelivery: [false],
      deliveryAddress: this.fb.group({
        street: [''],
        city: [''],
        state: [''],
        postalCode: [''],
        country: ['Nigeria'],
        landmark: ['']
      }),

      // Additional Information
      notes: [''],
      discount: [0, [Validators.min(0)]]
    });
  }

  get itemsArray(): FormArray {
    return this.orderForm.get('items') as FormArray;
  }

  get deliveryAddressGroup(): FormGroup {
    return this.orderForm.get('deliveryAddress') as FormGroup;
  }

  loadCustomers() {
    // TODO: Replace with actual customers service call
    const mockCustomers: Customer[] = [
      { id: '1', name: 'John Doe', email: 'john@example.com', phone: '+234801234567' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com', phone: '+234809876543' },
      { id: '3', name: 'Mike Johnson', email: 'mike@example.com' }
    ];
    this.customers.set(mockCustomers);
  }

  loadProducts() {
    this.catalogService.getProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.products.set(response.results);
          this.filteredProducts.set(response.results);
        },
        error: (error) => {
          this.toastService.showError('Failed to load products');
          console.error('Error loading products:', error);
        }
      });
  }

  loadCategories() {
    this.catalogService.getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.categories.set(response.results);
        },
        error: (error) => {
          console.error('Error loading categories:', error);
        }
      });
  }

  onCustomerChange() {
    const customerId = this.orderForm.get('customerId')?.value;
    const customer = this.customers().find(c => c.id === customerId);

    if (customer) {
      this.orderForm.patchValue({
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone || ''
      });
    }
  }

  addOrderItem() {
    const itemGroup = this.fb.group({
      productId: ['', Validators.required],
      productName: [''],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [0],
      totalPrice: [0]
    });

    this.itemsArray.push(itemGroup);
  }

  removeOrderItem(index: number) {
    this.itemsArray.removeAt(index);
  }

  onProductChange(index: number) {
    const itemGroup = this.itemsArray.at(index) as FormGroup;
    const productId = itemGroup.get('productId')?.value;
    const product =this.products().find(s => s.id === productId);

    if (sku) {
      itemGroup.patchValue({
        productName: product.name,
        unitPrice: product.price,
        quantity: 1
      });
      this.calculateItemTotal(index);
    }
  }

  onQuantityChange(index: number) {
    this.calculateItemTotal(index);
  }

  calculateItemTotal(index: number) {
    const itemGroup = this.itemsArray.at(index) as FormGroup;
    const quantity = itemGroup.get('quantity')?.value || 0;
    const unitPrice = itemGroup.get('unitPrice')?.value || 0;
    const totalPrice = quantity * unitPrice;

    itemGroup.patchValue({ totalPrice });
  }

  getOrderSubtotal(): number {
    return this.itemsArray.controls.reduce((total, control) => {
      const totalPrice = control.get('totalPrice')?.value || 0;
      return total + totalPrice;
    }, 0);
  }

  getOrderTotal(): number {
    const subtotal = this.getOrderSubtotal();
    const discount = this.orderForm.get('discount')?.value || 0;
    return Math.max(0, subtotal - discount);
  }

  nextStep() {
    if (this.currentStep() < this.totalSteps) {
      if (this.validateCurrentStep()) {
        this.currentStep.set(this.currentStep() + 1);
      }
    }
  }

  previousStep() {
    if (this.currentStep() > 1) {
      this.currentStep.set(this.currentStep() - 1);
    }
  }

  validateCurrentStep(): boolean {
    switch (this.currentStep()) {
      case 1:
        return this.orderForm.get('customerId')?.valid || false;
      case 2:
        return this.itemsArray.length > 0 && this.itemsArray.valid;
      case 3:
        if (this.orderForm.get('includeDelivery')?.value) {
          const deliveryGroup = this.deliveryAddressGroup;
          return deliveryGroup.get('street')?.value &&
                 deliveryGroup.get('city')?.value &&
                 deliveryGroup.get('state')?.value;
        }
        return true;
      default:
        return true;
    }
  }

  onSubmit() {
    if (this.orderForm.valid && this.itemsArray.length > 0) {
      this.isLoading.set(true);

      const formValue = this.orderForm.value;
      const items: CreateOrderItem[] = formValue.items.map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity
      }));

      const orderData: CreateOrderRequest = {
        customerId: formValue.customerId,
        items,
        notes: formValue.notes || undefined,
        discount: formValue.discount || undefined
      };

      if (formValue.includeDelivery) {
        orderData.deliveryAddress = formValue.deliveryAddress;
      }

      this.ordersService.createOrder(orderData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.orderCreated.emit();
            this.isLoading.set(false);
          },
          error: (error) => {
            this.toastService.showError('Failed to create order');
            this.isLoading.set(false);
          }
        });
    } else {
      this.toastService.showError('Please fill in all required fields');
    }
  }

  onClose() {
    this.close.emit();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  }

  getStepTitle(): string {
    switch (this.currentStep()) {
      case 1:
        return 'Customer Information';
      case 2:
        return 'Order Items';
      case 3:
        return 'Delivery & Summary';
      default:
        return '';
    }
  }

  filterProducts(searchTerm: string) {
    if (!searchTerm) {
      this.filteredProducts.set(this.products());
    } else {
      const filtered = this.products().filter(sku =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      this.filteredProducts.set(filtered);
    }
  }

  getProductAvailableQuantity(productId: string): number {
    const product =this.products().find(s => s.id === productId);
    return product?.stock_quantity || 0;
  }

  isQuantityValid(index: number): boolean {
    const itemGroup = this.itemsArray.at(index) as FormGroup;
    const productId = itemGroup.get('productId')?.value;
    const quantity = itemGroup.get('quantity')?.value || 0;
    const availableQuantity = this.getProductAvailableQuantity(productId);

    return quantity > 0 && quantity <= availableQuantity;
  }
}