package cloud_kitchen.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import cloud_kitchen.entity.Food;
import cloud_kitchen.entity.Order;
import cloud_kitchen.entity.OrderItem;
import cloud_kitchen.entity.User;
import cloud_kitchen.repository.FoodRepository;
import cloud_kitchen.repository.OrderItemRepository;
import cloud_kitchen.repository.OrderRepository;
import cloud_kitchen.repository.UserRepository;

@Service
public class OrderService {

    private static final double DELIVERY_FEE = 40.0;
    private static final double TAX_AMOUNT = 10.0;

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;
    private final FoodRepository foodRepository;

    public OrderService(
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            UserRepository userRepository,
            FoodRepository foodRepository
    ) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.userRepository = userRepository;
        this.foodRepository = foodRepository;
    }

    @Transactional
    public Order createOrder(
            Long userId,
            List<OrderItemRequest> items,
            String paymentMethod,
            String paymentStatus,

            String houseNumber,
            String street,
            String area,
            String village,
            String district,
            String pincode,
            String landmark,

            Double latitude,
            Double longitude,
            Double locationAccuracy
    ) {

        User user = userRepository
                .findById(userId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "User not found"
                        )
                );

        if (items == null || items.isEmpty()) {
            throw new RuntimeException(
                    "Order cannot be empty"
            );
        }

        if (pincode == null ||
                !pincode.matches("\\d{6}")) {

            throw new RuntimeException(
                    "Please enter a valid 6-digit PIN code"
            );
        }

        if (latitude == null ||
                longitude == null) {

            throw new RuntimeException(
                    "Please share your current location"
            );
        }

        Order order = new Order();

        order.setUser(user);

        order.setStatus("PLACED");

        order.setOrderDate(
                LocalDateTime.now()
        );

        order.setHouseNumber(houseNumber);
        order.setStreet(street);
        order.setArea(area);
        order.setVillage(village);
        order.setDistrict(district);
        order.setPincode(pincode);
        order.setLandmark(landmark);

        order.setLatitude(latitude);
        order.setLongitude(longitude);
        order.setLocationAccuracy(
                locationAccuracy
        );

        if (paymentMethod == null ||
                paymentMethod.isBlank()) {

            paymentMethod = "COD";
        }

        if (paymentStatus == null ||
                paymentStatus.isBlank()) {

            paymentStatus =
                    paymentMethod.equalsIgnoreCase(
                            "UPI"
                    )
                            ? "PAID"
                            : "PENDING";
        }

        order.setPaymentMethod(
                paymentMethod.toUpperCase()
        );

        order.setPaymentStatus(
                paymentStatus.toUpperCase()
        );

        double subtotal = 0;

        // Validate all items first
        for (OrderItemRequest request : items) {

            Food food = foodRepository
                    .findById(request.getFoodId())
                    .orElseThrow(() ->
                            new RuntimeException(
                                    "Food not found: " +
                                    request.getFoodId()
                            )
                    );

            if (food.getAvailable() != null &&
                    !food.getAvailable()) {

                throw new RuntimeException(
                        food.getName() +
                        " is currently unavailable"
                );
            }

            if (request.getQuantity() == null ||
                    request.getQuantity() <= 0) {

                throw new RuntimeException(
                        "Invalid quantity for " +
                        food.getName()
                );
            }

            subtotal +=
                    food.getPrice() *
                    request.getQuantity();
        }

        double deliveryFee =
                DELIVERY_FEE;

        double taxAmount =
                TAX_AMOUNT;

        double totalAmount =
                subtotal +
                deliveryFee +
                taxAmount;

        order.setSubtotal(subtotal);
        order.setDeliveryFee(deliveryFee);
        order.setTaxAmount(taxAmount);
        order.setTotalAmount(totalAmount);

        Order savedOrder =
                orderRepository.save(order);

        for (OrderItemRequest request : items) {

            Food food = foodRepository
                    .findById(request.getFoodId())
                    .orElseThrow(() ->
                            new RuntimeException(
                                    "Food not found: " +
                                    request.getFoodId()
                            )
                    );

            OrderItem orderItem =
                    new OrderItem();

            orderItem.setOrder(savedOrder);
            orderItem.setFood(food);
            orderItem.setQuantity(
                    request.getQuantity()
            );
            orderItem.setPrice(
                    food.getPrice()
            );

            orderItemRepository.save(
                    orderItem
            );
        }

        return orderRepository.save(
                savedOrder
        );
    }

    public List<Order> getOrdersByUser(
            Long userId
    ) {
        return orderRepository
                .findByUserIdOrderByOrderDateDesc(
                        userId
                );
    }

    public List<Order> getAllOrders() {
        return orderRepository
                .findAllByOrderByOrderDateDesc();
    }

    public Order getOrderById(Long id) {
        return orderRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Order not found"
                        )
                );
    }

    public Order updateStatus(
            Long id,
            String status
    ) {

        Order order =
                getOrderById(id);

        String newStatus =
                status.toUpperCase();

        order.setStatus(newStatus);

        return orderRepository.save(order);
    }

    public Order cancelOrder(Long id) {

        Order order =
                getOrderById(id);

        String currentStatus =
                order.getStatus();

        if (!currentStatus.equalsIgnoreCase(
                "PLACED"
        )) {

            throw new RuntimeException(
                    "This order can no longer be cancelled"
            );
        }

        order.setStatus("CANCELLED");

        return orderRepository.save(order);
    }

    public static class OrderItemRequest {

        private Long foodId;
        private Integer quantity;

        public Long getFoodId() {
            return foodId;
        }

        public void setFoodId(Long foodId) {
            this.foodId = foodId;
        }

        public Integer getQuantity() {
            return quantity;
        }

        public void setQuantity(
                Integer quantity
        ) {
            this.quantity = quantity;
        }
    }
}