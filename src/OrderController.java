package cloud_kitchen.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import cloud_kitchen.entity.Order;
import cloud_kitchen.service.OrderService;
import cloud_kitchen.service.OrderService.OrderItemRequest;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "http://localhost:5173")
public class OrderController {

    private final OrderService orderService;

    public OrderController(
            OrderService orderService
    ) {
        this.orderService = orderService;
    }

    @PostMapping
    public ResponseEntity<?> createOrder(

            @RequestParam Long userId,

            @RequestParam(
                    defaultValue = "COD"
            )
            String paymentMethod,

            @RequestParam(
                    defaultValue = "PENDING"
            )
            String paymentStatus,

            @RequestParam(required = false)
            String houseNumber,

            @RequestParam(required = false)
            String street,

            @RequestParam(required = false)
            String area,

            @RequestParam(required = false)
            String village,

            @RequestParam(required = false)
            String district,

            @RequestParam(required = false)
            String pincode,

            @RequestParam(required = false)
            String landmark,

            @RequestParam(required = false)
            Double latitude,

            @RequestParam(required = false)
            Double longitude,

            @RequestParam(required = false)
            Double locationAccuracy,

            @RequestBody
            List<OrderItemRequest> items
    ) {

        try {

            Order order =
                    orderService.createOrder(
                            userId,
                            items,
                            paymentMethod,
                            paymentStatus,

                            houseNumber,
                            street,
                            area,
                            village,
                            district,
                            pincode,
                            landmark,

                            latitude,
                            longitude,
                            locationAccuracy
                    );

            return ResponseEntity.ok(order);

        } catch (RuntimeException error) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            new ErrorResponse(
                                    error.getMessage()
                            )
                    );
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Order>>
    getUserOrders(
            @PathVariable Long userId
    ) {

        return ResponseEntity.ok(
                orderService.getOrdersByUser(
                        userId
                )
        );
    }

    @GetMapping
    public ResponseEntity<List<Order>>
    getAllOrders() {

        return ResponseEntity.ok(
                orderService.getAllOrders()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<Order>
    getOrder(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                orderService.getOrderById(id)
        );
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Order>
    updateStatus(
            @PathVariable Long id,
            @RequestBody StatusRequest request
    ) {

        return ResponseEntity.ok(
                orderService.updateStatus(
                        id,
                        request.getStatus()
                )
        );
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelOrder(
            @PathVariable Long id
    ) {

        try {

            return ResponseEntity.ok(
                    orderService.cancelOrder(id)
            );

        } catch (RuntimeException error) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            new ErrorResponse(
                                    error.getMessage()
                            )
                    );
        }
    }

    public static class StatusRequest {

        private String status;

        public String getStatus() {
            return status;
        }

        public void setStatus(
                String status
        ) {
            this.status = status;
        }
    }

    public static class ErrorResponse {

        private String message;

        public ErrorResponse(
                String message
        ) {
            this.message = message;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(
                String message
        ) {
            this.message = message;
        }
    }
}