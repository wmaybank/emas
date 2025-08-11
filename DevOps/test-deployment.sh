#!/bin/bash

# Script de testing para verificar el despliegue completo
# Ejecutar después del despliegue para verificar funcionalidad

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

BASE_URL="http://localhost"
API_URL="$BASE_URL/api"

# Detectar comando de Docker Compose
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
else
    DOCKER_COMPOSE_CMD="docker-compose"
fi

log() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Test frontend
test_frontend() {
    log "Testing frontend..."
    
    # Test index page
    if curl -f -s "$BASE_URL/" > /dev/null; then
        success "Frontend index page is accessible"
    else
        error "Frontend index page is not accessible"
        return 1
    fi
    
    # Test static assets
    if curl -f -s "$BASE_URL/static/css/" 2>/dev/null | grep -q "text/html\|text/css" || 
       curl -f -s "$BASE_URL/manifest.json" > /dev/null; then
        success "Static assets are being served"
    else
        warning "Some static assets might not be accessible"
    fi
}

# Test backend API
test_backend() {
    log "Testing backend API..."
    
    # Test health endpoint
    if curl -f -s "$API_URL/health" > /dev/null; then
        success "Backend health endpoint is working"
    else
        error "Backend health endpoint is not working"
        return 1
    fi
    
    # Test ping endpoint
    if curl -f -s "$API_URL/ping" | grep -q "status"; then
        success "Backend ping endpoint is working"
    else
        warning "Backend ping endpoint might not be working"
    fi
    
    # Test stations endpoint
    if curl -f -s "$API_URL/stations" > /dev/null; then
        success "Stations API endpoint is accessible"
    else
        warning "Stations API endpoint might not be accessible"
    fi
}

# Test WebSocket
test_websocket() {
    log "Testing WebSocket..."
    
    # Simple WebSocket test using curl
    if command -v wscat &> /dev/null; then
        timeout 5 wscat -c "ws://localhost/ws/realtime" --ping-interval 1 &> /dev/null && \
            success "WebSocket connection is working" || \
            warning "WebSocket might not be working (install wscat for better testing)"
    else
        warning "Install 'wscat' (npm install -g wscat) for WebSocket testing"
    fi
}

# Test monitoring services
test_monitoring() {
    log "Testing monitoring services..."
    
    # Test Grafana
    if curl -f -s "http://localhost:3000/api/health" > /dev/null; then
        success "Grafana is accessible"
    else
        warning "Grafana might not be accessible"
    fi
    
    # Test Prometheus
    if curl -f -s "http://localhost:9090/-/healthy" > /dev/null; then
        success "Prometheus is accessible"
    else
        warning "Prometheus might not be accessible"
    fi
}

# Test CORS
test_cors() {
    log "Testing CORS configuration..."
    
    # Test preflight request
    CORS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Origin: http://localhost" \
        -H "Access-Control-Request-Method: GET" \
        -H "Access-Control-Request-Headers: Content-Type" \
        -X OPTIONS "$API_URL/stations")
    
    if [ "$CORS_RESPONSE" = "204" ] || [ "$CORS_RESPONSE" = "200" ]; then
        success "CORS is configured correctly"
    else
        warning "CORS might not be configured correctly (got HTTP $CORS_RESPONSE)"
    fi
}

# Test nginx configuration
test_nginx() {
    log "Testing nginx configuration..."
    
    # Test SPA routing (React Router)
    if curl -f -s "$BASE_URL/nonexistent-route" | grep -q "<!doctype html" 2>/dev/null; then
        success "SPA routing is working (fallback to index.html)"
    else
        warning "SPA routing might not be working correctly"
    fi
    
    # Test API routing
    if curl -f -s "$API_URL/health" > /dev/null; then
        success "API routing through nginx is working"
    else
        error "API routing through nginx is not working"
    fi
}

# Test Docker containers
test_containers() {
    log "Testing Docker containers..."
    
    # Check if containers are running
    if docker ps | grep -q "emas-fullstack"; then
        success "Main application container is running"
    else
        error "Main application container is not running"
        return 1
    fi
    
    # Check container health
    HEALTH_STATUS=$(docker inspect --format='{{.State.Health.Status}}' emas-fullstack 2>/dev/null || echo "unknown")
    
    if [ "$HEALTH_STATUS" = "healthy" ]; then
        success "Container health check is passing"
    elif [ "$HEALTH_STATUS" = "starting" ]; then
        warning "Container is still starting up"
    else
        warning "Container health check status: $HEALTH_STATUS"
    fi
}

# Run performance test
test_performance() {
    log "Running basic performance test..."
    
    # Test response time
    RESPONSE_TIME=$(curl -o /dev/null -s -w "%{time_total}" "$BASE_URL/")
    
    if (( $(echo "$RESPONSE_TIME < 2.0" | bc -l) )); then
        success "Frontend response time is good (${RESPONSE_TIME}s)"
    else
        warning "Frontend response time is slow (${RESPONSE_TIME}s)"
    fi
    
    # Test API response time
    API_RESPONSE_TIME=$(curl -o /dev/null -s -w "%{time_total}" "$API_URL/health")
    
    if (( $(echo "$API_RESPONSE_TIME < 1.0" | bc -l) )); then
        success "API response time is good (${API_RESPONSE_TIME}s)"
    else
        warning "API response time is slow (${API_RESPONSE_TIME}s)"
    fi
}

# Main test runner
main() {
    echo "=========================================="
    echo "EMAS Deployment Test Suite"
    echo "=========================================="
    echo ""
    
    FAILED_TESTS=0
    
    # Wait for services to be ready
    log "Waiting for services to be ready..."
    sleep 5
    
    # Run tests
    test_containers || ((FAILED_TESTS++))
    test_frontend || ((FAILED_TESTS++))
    test_backend || ((FAILED_TESTS++))
    test_nginx || ((FAILED_TESTS++))
    test_cors || ((FAILED_TESTS++))
    test_websocket
    test_monitoring
    
    # Performance test (optional)
    if command -v bc &> /dev/null; then
        test_performance
    else
        warning "Install 'bc' for performance testing"
    fi
    
    echo ""
    echo "=========================================="
    
    if [ $FAILED_TESTS -eq 0 ]; then
        success "All critical tests passed! ✅"
        echo ""
        echo "🌐 Frontend: $BASE_URL/"
        echo "🔧 API: $API_URL/"
        echo "📊 Grafana: http://localhost:3000/"
        echo "📈 Prometheus: http://localhost:9090/"
    else
        error "$FAILED_TESTS critical test(s) failed! ❌"
        echo ""
        echo "Check the logs with:"
        echo "$DOCKER_COMPOSE_CMD -f DevOps/docker-compose.fullstack.yml logs -f"
        exit 1
    fi
    
    echo "=========================================="
}

# Run if not sourced
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
